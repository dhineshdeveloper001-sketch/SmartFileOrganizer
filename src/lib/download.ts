'use client';

import api from '@/lib/api';

export async function downloadFile(id: number, filename: string, adminPrefix: string = '') {
  try {
    const result = await api.downloadFile(`${adminPrefix}/files/${id}/download`);
    const url = window.URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', result.filename || filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err: unknown) {
    const error = err as { message?: string };
    alert(`Download failed: ${error?.message || 'File not found'}`);
  }
}
