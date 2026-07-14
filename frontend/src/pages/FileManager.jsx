import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, Image, Film, FileText, FileArchive, Music, Trash2, Edit2, Download } from 'lucide-react';
import api from '../utils/api';

const getFileIcon = (category) => {
  switch (category) {
    case 'Images': return <Image size={24} className="text-primary" style={{ color: 'var(--primary-color)' }} />;
    case 'Videos': return <Film size={24} className="text-danger" style={{ color: 'var(--danger)' }} />;
    case 'Documents': return <FileText size={24} className="text-success" style={{ color: 'var(--success)' }} />;
    case 'PDF': return <FileText size={24} style={{ color: '#ef4444' }} />;
    case 'Audio': return <Music size={24} style={{ color: '#8b5cf6' }} />;
    case 'Archives': return <FileArchive size={24} style={{ color: '#f59e0b' }} />;
    default: return <File size={24} className="text-muted" />;
  }
};

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileManager = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = async () => {
    try {
      const response = await api.get('/files');
      setFiles(response.data);
    } catch (err) {
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    setUploading(true);
    const formData = new FormData();
    acceptedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      await api.post('/files/upload-multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchFiles();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please check file size limits.');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await api.delete(`/files/${id}`);
        fetchFiles();
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  const handleRename = async (id, currentName) => {
    const newName = prompt('Enter new filename:', currentName);
    if (newName && newName !== currentName) {
      try {
        await api.put(`/files/${id}/rename`, { name: newName });
        fetchFiles();
      } catch (err) {
        console.error('Rename failed:', err);
      }
    }
  };

  const handleDownload = async (id, filename) => {
    try {
      const response = await api.get(`/files/${id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>File Manager</h2>
      </div>

      {/* Upload Dropzone */}
      <div className="card mb-4" style={{ padding: '2rem', textAlign: 'center', backgroundColor: isDragActive ? 'var(--primary-light)' : 'var(--card-bg)', border: isDragActive ? '2px dashed var(--primary-color)' : '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s' }} {...getRootProps()}>
        <input {...getInputProps()} />
        <UploadCloud size={48} style={{ color: 'var(--primary-color)', margin: '0 auto 1rem' }} />
        {uploading ? (
          <p style={{ fontWeight: '500' }}>Uploading files...</p>
        ) : isDragActive ? (
          <p style={{ fontWeight: '500', color: 'var(--primary-color)' }}>Drop the files here ...</p>
        ) : (
          <div>
            <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Drag & drop some files here, or click to select files</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Supports all file types up to 500MB</p>
          </div>
        )}
      </div>

      {/* Files List */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Your Files</h3>
        {loading ? (
          <p>Loading files...</p>
        ) : files.length === 0 ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: '2rem 0' }}>No files found. Upload some to get started!</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Size</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map(file => (
                  <tr key={file.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.category)}
                        <span style={{ fontWeight: '500', wordBreak: 'break-all' }}>{file.originalFilename}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        backgroundColor: 'var(--bg-color)', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '500' 
                      }}>
                        {file.category}
                      </span>
                    </td>
                    <td>{formatSize(file.size)}</td>
                    <td>{new Date(file.uploadDate).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleDownload(file.id, file.originalFilename)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} title="Download">
                          <Download size={16} />
                        </button>
                        <button onClick={() => handleRename(file.id, file.originalFilename)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }} title="Rename">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(file.id)} className="btn btn-outline text-danger" style={{ padding: '0.25rem 0.5rem', borderColor: 'var(--danger)' }} title="Delete">
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
    </div>
  );
};

export default FileManager;
