import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import api from '../utils/api';
import { HardDrive, FileText, Database } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/files/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (!stats) return <div>Failed to load statistics.</div>;

  const categoryColors = {
    'Images': '#2563eb',     // blue
    'Videos': '#ef4444',     // red
    'Documents': '#22c55e',  // green
    'PDF': '#f97316',        // orange
    'Audio': '#8b5cf6',      // purple
    'Archives': '#f59e0b',   // amber
    'Others': '#64748b'      // slate
  };

  const categories = Object.keys(stats.filesByCategory || {});
  
  const doughnutData = {
    labels: categories,
    datasets: [
      {
        data: categories.map(c => stats.filesByCategory[c]),
        backgroundColor: categories.map(c => categoryColors[c] || categoryColors['Others']),
        borderWidth: 1,
      },
    ],
  };

  const barData = {
    labels: categories,
    datasets: [
      {
        label: 'Storage Used (MB)',
        data: categories.map(c => (stats.storageByCategory[c] / (1024 * 1024)).toFixed(2)),
        backgroundColor: 'rgba(37, 99, 235, 0.8)',
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, title: { display: true, text: 'Megabytes (MB)' } } }
  };

  return (
    <div>
      <h2 className="mb-4">Dashboard Overview</h2>
      
      {/* Top Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-md)' }}>
            <FileText size={32} style={{ color: 'var(--primary-color)' }} />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: '500' }}>Total Files</p>
            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{stats.totalFiles}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#dcfce7', borderRadius: 'var(--radius-md)' }}>
            <Database size={32} style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: '500' }}>Storage Used</p>
            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{formatSize(stats.totalStorageUsed)}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: 'var(--radius-md)' }}>
            <HardDrive size={32} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: '500' }}>Available Quota</p>
            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{formatSize((500 * 1024 * 1024) - stats.totalStorageUsed)}</h3>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Category Distribution</h3>
          {categories.length > 0 ? (
            <div style={{ position: 'relative', height: '300px', display: 'flex', justifyContent: 'center' }}>
              <Doughnut data={doughnutData} options={{ maintainAspectRatio: false }} />
            </div>
          ) : (
            <p className="text-muted" style={{ textAlign: 'center', marginTop: '4rem' }}>No data available</p>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Storage by Category</h3>
          {categories.length > 0 ? (
            <div style={{ position: 'relative', height: '300px' }}>
              <Bar data={barData} options={barOptions} />
            </div>
          ) : (
             <p className="text-muted" style={{ textAlign: 'center', marginTop: '4rem' }}>No data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
