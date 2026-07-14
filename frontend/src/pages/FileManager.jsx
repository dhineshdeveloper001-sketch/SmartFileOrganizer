import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, Image, Film, FileText, FileArchive, Music, Trash2, Edit2, Download, CheckCircle, XCircle, Search, Filter, Eye, X, RefreshCw, XSquare, ArrowUp, ArrowDown } from 'lucide-react';
import api from '../utils/api';

const getFileIcon = (category) => {
  switch (category) {
    case 'Images': return <Image size={24} className="text-primary" />;
    case 'Videos': return <Film size={24} className="text-danger" />;
    case 'Documents': return <FileText size={24} className="text-success" />;
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

const formatSpeed = (bytesPerSec) => {
  if (!bytesPerSec || bytesPerSec === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s'];
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
  return parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatETA = (seconds) => {
  if (seconds === undefined || seconds === null || seconds === Infinity || isNaN(seconds)) return 'calculating...';
  if (seconds < 60) return Math.max(0, Math.round(seconds)) + 's';
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = Math.round(seconds % 60);
  return `${minutes}m ${remainingSecs}s`;
};

const FileManager = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState([]);
  
  // Search, Filter, Sort, Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('uploadDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [previewFile, setPreviewFile] = useState(null);
  
  const abortControllers = useRef(new Map());

  const fetchFiles = useCallback(async () => {
    try {
      const response = await api.get('/files');
      setFiles(response.data);
    } catch (err) {
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const onDrop = useCallback((acceptedFiles) => {
    const newUploads = acceptedFiles.map(file => {
      // Client side size validation
      if (file.size > 500 * 1024 * 1024) {
        return {
          id: crypto.randomUUID(),
          file,
          progress: 0,
          status: 'error',
          errorMessage: 'File exceeds 500MB limit',
          speed: 0,
          eta: 0,
          loaded: 0
        };
      }
      return {
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: 'uploading',
        speed: 0,
        eta: 0,
        errorMessage: '',
        loaded: 0
      };
    });

    setUploads(prev => [...newUploads, ...prev]);

    newUploads.forEach(async (uploadItem) => {
      if (uploadItem.status === 'error') return; // Skip oversized files

      const formData = new FormData();
      formData.append('file', uploadItem.file);

      const controller = new AbortController();
      abortControllers.current.set(uploadItem.id, controller);

      let lastLoaded = 0;
      let lastTime = Date.now();

      try {
        await api.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          signal: controller.signal,
          onUploadProgress: (progressEvent) => {
            const { loaded, total } = progressEvent;
            const percentage = Math.round((loaded * 100) / total);
            
            const currentTime = Date.now();
            const timeElapsed = (currentTime - lastTime) / 1000; 
            
            let speed = 0;
            let eta = 0;
            
            if (timeElapsed > 0.5) { 
              const bytesSinceLast = loaded - lastLoaded;
              speed = bytesSinceLast / timeElapsed;
              const remainingBytes = total - loaded;
              eta = speed > 0 ? remainingBytes / speed : 0;
              lastLoaded = loaded;
              lastTime = currentTime;
              
              setUploads(prev => prev.map(u => 
                u.id === uploadItem.id ? { 
                  ...u, progress: percentage, speed: speed, eta: eta, loaded: loaded 
                } : u
              ));
            } else {
              setUploads(prev => prev.map(u => 
                u.id === uploadItem.id ? { ...u, progress: percentage, loaded: loaded } : u
              ));
            }
          }
        });

        setUploads(prev => prev.map(u => 
          u.id === uploadItem.id ? { ...u, progress: 100, loaded: uploadItem.file.size, status: 'success' } : u
        ));
        abortControllers.current.delete(uploadItem.id);
        fetchFiles();
        
      } catch (err) {
        if (err.name === 'CanceledError' || err.message === 'canceled') {
          console.log('Upload canceled');
        } else {
          console.error('Upload failed for', uploadItem.file.name, err);
          setUploads(prev => prev.map(u => 
            u.id === uploadItem.id ? { ...u, status: 'error', errorMessage: err.response?.data?.message || 'Upload failed' } : u
          ));
        }
        abortControllers.current.delete(uploadItem.id);
      }
    });
  }, [fetchFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const cancelUpload = (id) => {
    if (abortControllers.current.has(id)) {
      abortControllers.current.get(id).abort();
      abortControllers.current.delete(id);
    }
    setUploads(prev => prev.map(u => u.id === id ? { ...u, status: 'error', errorMessage: 'Canceled by user' } : u));
  };

  const retryUpload = (id) => {
    const uploadToRetry = uploads.find(u => u.id === id);
    if (uploadToRetry) {
      setUploads(prev => prev.filter(u => u.id !== id));
      onDrop([uploadToRetry.file]);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await api.delete(`/files/${id}`);
        fetchFiles();
      } catch (err) {
        console.error('Delete failed:', err);
        alert(err.response?.data?.message || 'Delete failed');
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
        alert(err.response?.data?.message || 'Rename failed');
      }
    }
  };

  const handleDownload = async (id, filename) => {
    try {
      const response = await api.get(`/files/${id}/download`, {
        responseType: 'blob',
      });
      
      // If backend returns an error message as JSON instead of file blob
      if (response.data.type === 'application/json') {
        const text = await response.data.text();
        const errorObj = JSON.parse(text);
        throw new Error(errorObj.message || 'File download failed');
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert(`Download failed: ${err.message || 'Network error'}`);
    }
  };

  const handlePreview = async (id, filename, category) => {
    if (category !== 'Images') {
      alert('Preview is only available for images currently.');
      return;
    }
    try {
      const response = await api.get(`/files/${id}/download`, { responseType: 'blob' });
      if (response.data.type === 'application/json') {
        throw new Error('Preview failed');
      }
      const url = window.URL.createObjectURL(new Blob([response.data]));
      setPreviewFile({ name: filename, url });
    } catch (err) {
      console.error('Preview failed:', err);
      alert('Could not load preview');
    }
  };

  // Filter & Sort Logic
  const filteredFiles = files
    .filter(f => categoryFilter === 'All' || f.category === categoryFilter)
    .filter(f => f.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (sortBy === 'originalFilename') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
  const currentFiles = filteredFiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h2>File Manager</h2>
      </div>

      {/* Upload Dropzone */}
      <div className={`card mb-4 upload-zone ${isDragActive ? 'drag-active' : ''}`} {...getRootProps()}>
        <input {...getInputProps()} />
        <UploadCloud size={48} className="upload-icon-pulse" />
        {isDragActive ? (
          <p style={{ fontWeight: '500', color: 'var(--primary-color)' }}>Drop the files here ...</p>
        ) : (
          <div>
            <p style={{ fontWeight: '500', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Drag & drop files here, or click to browse</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Supports all file types up to 500MB</p>
          </div>
        )}
      </div>

      {/* Active Uploads */}
      {uploads.length > 0 && (
        <div className="card mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Upload Queue</h3>
            <button 
              className="btn btn-outline" 
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
              onClick={() => setUploads(uploads.filter(u => u.status === 'uploading'))}
            >
              Clear Completed
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {uploads.map(upload => (
              <div key={upload.id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', backgroundColor: 'var(--bg-color)' }}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2" style={{ maxWidth: '60%' }}>
                    <span style={{ fontWeight: '500', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {upload.file.name}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({formatSize(upload.file.size)})</span>
                  </div>
                  
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                    {upload.status === 'success' && <span className="flex items-center gap-1 text-success"><CheckCircle size={16} /> Completed</span>}
                    {upload.status === 'error' && <span className="flex items-center gap-1 text-danger"><XCircle size={16} /> {upload.errorMessage}</span>}
                    {upload.status === 'uploading' && <span className="text-primary">{upload.progress}%</span>}
                  </span>
                </div>
                
                <div style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '9999px', height: '0.5rem', overflow: 'hidden', marginBottom: '0.5rem' }}>
                  <div style={{ 
                    height: '100%', 
                    backgroundColor: upload.status === 'error' ? 'var(--danger)' : upload.status === 'success' ? 'var(--success)' : 'var(--primary-color)',
                    width: `${upload.progress}%`,
                    transition: 'width 0.2s ease-in-out'
                  }} />
                </div>
                
                <div className="flex justify-between text-muted items-center" style={{ fontSize: '0.8rem' }}>
                  {upload.status === 'uploading' ? (
                    <>
                      <span>{formatSize(upload.loaded)} / {formatSize(upload.file.size)} &bull; {formatSpeed(upload.speed)}</span>
                      <div className="flex items-center gap-2">
                        <span>ETA: {formatETA(upload.eta)}</span>
                        <button onClick={() => cancelUpload(upload.id)} className="btn btn-outline" style={{ padding: '0.1rem 0.3rem', fontSize: '0.7rem' }}>Cancel</button>
                      </div>
                    </>
                  ) : upload.status === 'error' ? (
                    <button onClick={() => retryUpload(upload.id)} className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <RefreshCw size={12} /> Retry
                    </button>
                  ) : (
                    <span>Upload complete</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files List Tools */}
      <div className="card mb-4">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex flex-wrap gap-4 flex-1">
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search files by name..." 
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
            
            <div className="form-group" style={{ marginBottom: 0, minWidth: '150px' }}>
              <div style={{ position: 'relative' }}>
                <Filter size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select 
                  className="form-input"
                  value={categoryFilter}
                  onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                  style={{ paddingLeft: '2.5rem', appearance: 'none' }}
                >
                  <option value="All">All Categories</option>
                  <option value="Images">Images</option>
                  <option value="Videos">Videos</option>
                  <option value="Documents">Documents</option>
                  <option value="PDF">PDF</option>
                  <option value="Audio">Audio</option>
                  <option value="Archives">Archives</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Files Table */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center" style={{ padding: '3rem 0' }}>
            <div className="spinner spinner-primary"></div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: '3rem 0' }}>No files found matching your criteria.</p>
        ) : (
          <>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th onClick={() => handleSort('originalFilename')} style={{ cursor: 'pointer' }}>
                      <div className="flex items-center gap-1">Name {sortBy === 'originalFilename' && (sortOrder === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>)}</div>
                    </th>
                    <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                      <div className="flex items-center gap-1">Category {sortBy === 'category' && (sortOrder === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>)}</div>
                    </th>
                    <th onClick={() => handleSort('size')} style={{ cursor: 'pointer' }}>
                      <div className="flex items-center gap-1">Size {sortBy === 'size' && (sortOrder === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>)}</div>
                    </th>
                    <th onClick={() => handleSort('uploadDate')} style={{ cursor: 'pointer' }}>
                      <div className="flex items-center gap-1">Date {sortBy === 'uploadDate' && (sortOrder === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>)}</div>
                    </th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentFiles.map(file => (
                    <tr key={file.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.category)}
                          <span style={{ fontWeight: '500', wordBreak: 'break-all' }}>{file.originalFilename}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          backgroundColor: 'var(--bg-color)', padding: '0.3rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: '500', border: '1px solid var(--border-color)'
                        }}>
                          {file.category}
                        </span>
                      </td>
                      <td>{formatSize(file.size)}</td>
                      <td>{new Date(file.uploadDate).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex justify-end gap-1 flex-wrap">
                          {file.category === 'Images' && (
                            <button onClick={() => handlePreview(file.id, file.originalFilename, file.category)} className="btn btn-outline" style={{ padding: '0.4rem' }} title="Preview">
                              <Eye size={16} />
                            </button>
                          )}
                          <button onClick={() => handleDownload(file.id, file.originalFilename)} className="btn btn-outline text-primary" style={{ padding: '0.4rem', borderColor: 'var(--primary-color)' }} title="Download">
                            <Download size={16} />
                          </button>
                          <button onClick={() => handleRename(file.id, file.originalFilename)} className="btn btn-outline" style={{ padding: '0.4rem' }} title="Rename">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(file.id)} className="btn btn-danger" style={{ padding: '0.4rem' }} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredFiles.length)} of {filteredFiles.length} files
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1}
                    className="btn btn-outline"
                    style={{ padding: '0.4rem 0.8rem' }}
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    disabled={currentPage === totalPages}
                    className="btn btn-outline"
                    style={{ padding: '0.4rem 0.8rem' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem'
        }}>
          <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ color: 'white' }}>{previewFile.name}</h3>
            <button onClick={() => { window.URL.revokeObjectURL(previewFile.url); setPreviewFile(null); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <XSquare size={28} />
            </button>
          </div>
          <img src={previewFile.url} alt="Preview" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', backgroundColor: 'white', borderRadius: 'var(--radius-md)' }} />
        </div>
      )}
    </div>
  );
};

export default FileManager;
