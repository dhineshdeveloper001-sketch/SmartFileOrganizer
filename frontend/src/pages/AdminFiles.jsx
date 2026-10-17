import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Search, Download, Trash2, FileText, Image, Film, FileArchive, Music, Clock } from 'lucide-react';

const getFileIcon = (category) => {
  switch (category) {
    case 'Images': return <Image size={18} className="text-primary" />;
    case 'Videos': return <Film size={18} className="text-danger" />;
    case 'Documents': return <FileText size={18} className="text-success" />;
    case 'PDF': return <FileText size={18} style={{ color: '#ef4444' }} />;
    case 'Audio': return <Music size={18} style={{ color: '#8b5cf6' }} />;
    case 'Archives': return <FileArchive size={18} style={{ color: '#f59e0b' }} />;
    default: return <FileText size={18} className="text-muted" />;
  }
};

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AdminFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFiles = async () => {
    try {
      const response = await api.get('/admin/files');
      setFiles(response.data);
    } catch (err) {
      console.error('Failed to fetch files', err);
      alert('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDownload = async (id, filename) => {
    try {
      const response = await api.get(`/admin/files/${id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (err) {
      if (err.response && err.response.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const json = JSON.parse(text);
          alert(`Download failed: ${json.message}`);
        } catch (e) {
          alert('Download failed');
        }
      } else {
        alert('Download failed');
      }
    }
  };

  const handleDelete = async (id, filename) => {
    if (window.confirm(`Are you sure you want to permanently delete '${filename}' from the entire system?`)) {
      try {
        await api.delete(`/admin/files/${id}`);
        alert('File deleted successfully globally!');
        fetchFiles();
      } catch (err) {
        alert(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const filteredFiles = files.filter(f => 
    f.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h2>Manage System Files</h2>
      </div>

      <div className="card mb-4" style={{ padding: '1rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search by file name or owner..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
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
          <p className="text-muted text-center" style={{ padding: '3rem 0' }}>No files found.</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Owner</th>
                  <th>Category</th>
                  <th>Size</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map(f => (
                  <tr key={f.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {getFileIcon(f.category)}
                        <span style={{ fontWeight: '500', wordBreak: 'break-all' }}>{f.originalFilename}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '500', color: 'var(--primary-color)' }}>@{f.owner}</span>
                    </td>
                    <td>
                      <span style={{ 
                        backgroundColor: 'var(--bg-color)', padding: '0.3rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '500', border: '1px solid var(--border-color)'
                      }}>
                        {f.category}
                      </span>
                    </td>
                    <td>{formatSize(f.size)}</td>
                    <td>
                      <span className="flex items-center gap-1 text-muted" style={{ fontSize: '0.85rem' }}>
                        <Clock size={14} /> {new Date(f.uploadDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleDownload(f.id, f.originalFilename)} className="btn btn-outline" style={{ padding: '0.4rem' }} title="Download file">
                          <Download size={16} />
                        </button>
                        <button onClick={() => handleDelete(f.id, f.originalFilename)} className="btn btn-danger" style={{ padding: '0.4rem' }} title="Delete globally">
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

export default AdminFiles;
