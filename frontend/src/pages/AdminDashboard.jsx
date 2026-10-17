import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Users, FileText, Database } from 'lucide-react';

const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch admin stats', err);
        setError(err.response?.data?.message || 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center" style={{ minHeight: '50vh' }}>
      <div className="spinner spinner-primary"></div>
    </div>
  );

  if (error) return <div className="card text-center text-danger">{error}</div>;

  return (
    <div>
      <h2 className="mb-4">System Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-lg)', color: 'var(--primary-color)' }}>
            <Users size={28} />
          </div>
          <div>
            <p className="text-muted" style={{ fontWeight: '500', marginBottom: '0.2rem' }}>Total Users</p>
            <h3 style={{ fontSize: '1.75rem', margin: 0 }}>{stats?.totalUsers || 0}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#dcfce7', borderRadius: 'var(--radius-lg)', color: '#16a34a' }}>
            <FileText size={28} />
          </div>
          <div>
            <p className="text-muted" style={{ fontWeight: '500', marginBottom: '0.2rem' }}>Total Files</p>
            <h3 style={{ fontSize: '1.75rem', margin: 0 }}>{stats?.totalFiles || 0}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: 'var(--radius-lg)', color: '#d97706' }}>
            <Database size={28} />
          </div>
          <div>
            <p className="text-muted" style={{ fontWeight: '500', marginBottom: '0.2rem' }}>Total Storage Used</p>
            <h3 style={{ fontSize: '1.75rem', margin: 0 }}>{formatSize(stats?.totalStorageUsed)}</h3>
          </div>
        </div>
      </div>
      
      <div className="card mt-4">
        <h3 className="mb-4">Welcome to the Admin Panel</h3>
        <p className="text-muted">
          Use the sidebar to manage users and view all uploaded files across the entire system.
          Deleting a user will completely remove all their uploaded files from the server.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
