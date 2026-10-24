'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Search, Download, Trash2 } from 'lucide-react';
import { getFileIcon } from '@/lib/fileIcons';
import { formatSize } from '@/lib/utils';
import { downloadFile } from '@/lib/download';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import AdminLayout from '@/components/AdminLayout';
import type { FileItem } from '@/types';

export default function AdminFilesPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFiles = async () => {
    try {
      const data = await api.get<FileItem[]>('/admin/files');
      setFiles(data);
    } catch (err: unknown) {
      console.error('Failed to fetch files', err);
      alert('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ROLE_ADMIN') {
      fetchFiles();
    }
  }, [user]);

  const handleDelete = async (id: number, filename: string) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete '${filename}' from the entire system?`
      )
    ) {
      try {
        await api.delete(`/admin/files/${id}`);
        alert('File deleted successfully globally!');
        fetchFiles();
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        alert(e.response?.data?.message || e.message || 'Delete failed');
      }
    }
  };

  const filteredFiles = files.filter(
    (f) =>
      f.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.owner && f.owner.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (authLoading || !user) return null;

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h2>Manage System Files</h2>
      </div>

      <div className="card mb-4" style={{ padding: '1rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Search by filename or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center" style={{ padding: '3rem 0' }}>
            <div className="spinner spinner-primary"></div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: '3rem 0' }}>
            No files found matching your criteria.
          </p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Category</th>
                  <th>Owner</th>
                  <th>Size</th>
                  <th>Upload Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.category)}
                        <span style={{ fontWeight: '500', wordBreak: 'break-all' }}>
                          {file.originalFilename}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          backgroundColor: 'var(--bg-color)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {file.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '500', color: 'var(--primary-color)' }}>
                        {file.owner || 'Unknown'}
                      </span>
                    </td>
                    <td>{formatSize(file.size)}</td>
                    <td>{new Date(file.uploadDate).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => downloadFile(file.id, file.originalFilename, '/admin')}
                          className="btn btn-outline text-primary"
                          style={{ padding: '0.4rem', borderColor: 'var(--primary-color)' }}
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(file.id, file.originalFilename)}
                          className="btn btn-danger"
                          style={{ padding: '0.4rem' }}
                          title="Delete Globally"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
