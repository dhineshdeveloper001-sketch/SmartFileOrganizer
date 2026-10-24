export interface FileItem {
  id: number;
  originalFilename: string;
  category: string;
  size: number;
  uploadDate: string;
  owner?: string;
}

export interface UserStats {
  totalFiles: number;
  totalStorageUsed: number;
  filesByCategory: Record<string, number>;
  storageByCategory: Record<string, number>;
}

export interface AdminStats {
  totalUsers: number;
  totalFiles: number;
  totalStorageUsed: number;
}

export interface UserItem {
  id: number;
  username: string;
  role: string;
  totalFiles: number;
}

export interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  errorMessage: string;
  speed: number;
  eta: number;
  loaded: number;
}
