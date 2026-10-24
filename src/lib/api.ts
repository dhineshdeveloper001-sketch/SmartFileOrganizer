const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  responseType?: 'json' | 'blob';
  onUploadProgress?: (progress: { loaded: number; total: number }) => void;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private buildUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    if (this.baseUrl.endsWith('/api') && cleanPath.startsWith('/api/')) {
      return cleanPath;
    }
    return `${this.baseUrl}${cleanPath}`;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private getHeaders(custom?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      ...custom,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async get<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  async post<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  async put<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  async delete<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  async uploadFile(
    path: string,
    formData: FormData,
    options?: {
      signal?: AbortSignal;
      onUploadProgress?: (progress: { loaded: number; total: number }) => void;
    }
  ): Promise<unknown> {
    const url = this.buildUrl(path);
    const headers = this.getHeaders();
    // Don't set Content-Type for FormData – browser sets it with boundary

    if (options?.onUploadProgress) {
      // Use XMLHttpRequest for upload progress
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);

        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            options.onUploadProgress!({ loaded: event.loaded, total: event.total });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              resolve(xhr.responseText);
            }
          } else {
            try {
              reject({ status: xhr.status, message: JSON.parse(xhr.responseText)?.message || 'Upload failed' });
            } catch {
              reject({ status: xhr.status, message: 'Upload failed' });
            }
          }
        };

        xhr.onerror = () => reject({ message: 'Network error' });

        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            xhr.abort();
            reject({ name: 'CanceledError', message: 'canceled' });
          });
        }

        xhr.send(formData);
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      signal: options?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { status: response.status, message: (errorData as Record<string, string>)?.message || 'Upload failed' };
    }

    return response.json().catch(() => ({}));
  }

  async downloadFile(path: string): Promise<{ blob: Blob; filename?: string }> {
    const url = this.buildUrl(path);
    const headers = this.getHeaders();

    const response = await fetch(url, { headers });

    if (!response.ok) {
      // Try to parse error from response
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        throw new Error((errorData as Record<string, string>)?.message || 'Download failed');
      }
      throw new Error('Download failed');
    }

    const blob = await response.blob();

    // Check if blob is actually a JSON error
    if (blob.type === 'application/json') {
      const text = await blob.text();
      const errorObj = JSON.parse(text);
      throw new Error(errorObj?.message || 'File download failed');
    }

    // Extract filename from Content-Disposition header if available
    const contentDisposition = response.headers.get('content-disposition');
    let filename: string | undefined;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match) {
        filename = match[1].replace(/['"]/g, '');
      }
    }

    return { blob, filename };
  }

  private async request<T>(path: string, options: RequestOptions): Promise<T> {
    const url = this.buildUrl(path);
    const headers = this.getHeaders(options.headers);

    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
      signal: options.signal,
    };

    if (options.body) {
      if (options.body instanceof FormData) {
        fetchOptions.body = options.body;
      } else {
        headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(options.body);
      }
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = {
        status: response.status,
        message: (errorData as Record<string, string>)?.message || `Request failed with status ${response.status}`,
        response: { data: errorData },
      };
      throw error;
    }

    if (options.responseType === 'blob') {
      return response.blob() as unknown as T;
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) return {} as T;

    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }
}

const api = new ApiClient(API_BASE_URL);
export default api;
