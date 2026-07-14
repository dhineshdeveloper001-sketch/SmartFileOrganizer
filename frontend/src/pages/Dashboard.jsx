import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { HardDrive, FileText, Database, UploadCloud, Folder, Clock, Image, Film, FileArchive, Music } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (category) => {
  switch (category) {
    case 'Images': return <Image size={20} className="text-primary" />;
    case 'Videos': return <Film size={20} className="text-danger" />;
    case 'Documents': return <FileText size={20} className="text-success" />;
    case 'PDF': return <FileText size={20} style={{ color: '#ef4444' }} />;
    case 'Audio': return <Music size={20} style={{ color: '#8b5cf6' }} />;
    case 'Archives': return <FileArchive size={20} style={{ color: '#f59e0b' }} />;
    default: return <FileText size={20} className="text-muted" />;
  }
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentFiles, setRecentFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, filesRes] = await Promise.all([
          api.get('/files/stats'),
          api.get('/files')
        ]);
        setStats(statsRes.data);
        // Assuming files are returned sorted by date desc from backend
        setRecentFiles(filesRes.data.slice(0, 5));
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center" style={{ minHeight: '50vh' }}>
      <div className="spinner spinner-primary"></div>
    </div>
  );
  
  if (!stats) return <div className="text-danger text-center mt-4">Failed to load dashboard data.</div>;

  const categoryColors = {
    'Images': '#7c3aed',     // primary purple
    'Videos': '#ef4444',     // red
    'Documents': '#10b981',  // green
    'PDF': '#f97316',        // orange
    'Audio': '#3b82f6',      // blue
    'Archives': '#f59e0b',   // amber
    'Others': '#64748b'      // slate
  };

  const categories = Object.keys(stats.filesByCategory || {});
  
  const doughnutData = {
    labels: categories,
    datasets: [{
      data: categories.map(c => stats.filesByCategory[c]),
      backgroundColor: categories.map(c => categoryColors[c] || categoryColors['Others']),
      borderWidth: 0,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Outfit' } } }
    },
    cutout: '70%'
  };

  const barData = {
    labels: categories,
    datasets: [{
      label: 'Storage Used (MB)',
      data: categories.map(c => (stats.storageByCategory[c] / (1024 * 1024)).toFixed(2)),
      backgroundColor: 'rgba(124, 58, 237, 0.8)', // Primary color with opacity
      borderRadius: 4,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { 
        beginAtZero: true, 
        grid: { color: 'var(--border-color)', borderDash: [5, 5] },
        title: { display: true, text: 'Megabytes (MB)', font: { family: 'Outfit', size: 12 } }
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h2>Dashboard Overview</h2>
      </div>
      
      {/* Top Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-lg)' }}>
            <FileText size={28} style={{ color: 'var(--primary-color)' }} />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Total Files</p>
            <h3 style={{ fontSize: '1.75rem', margin: 0, lineHeight: 1 }}>{stats.totalFiles}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--success-light)', borderRadius: 'var(--radius-lg)' }}>
            <Database size={28} style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Storage Used</p>
            <h3 style={{ fontSize: '1.75rem', margin: 0, lineHeight: 1 }}>{formatSize(stats.totalStorageUsed)}</h3>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: 'var(--radius-lg)' }}>
            <HardDrive size={28} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Available Quota</p>
            <h3 style={{ fontSize: '1.75rem', margin: 0, lineHeight: 1 }}>{formatSize((500 * 1024 * 1024) - stats.totalStorageUsed)}</h3>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }} className="lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="card lg:col-span-1">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Quick Actions</h3>
          <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
            <Link to="/files" className="btn btn-primary w-full" style={{ justifyContent: 'flex-start' }}>
              <UploadCloud size={18} /> Upload New File
            </Link>
            <Link to="/files" className="btn btn-outline w-full" style={{ justifyContent: 'flex-start' }}>
              <Folder size={18} /> View All Files
            </Link>
          </div>
          
          <div style={{ marginTop: '2rem', padding: '1.25rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Storage Quota</h4>
            <div style={{ width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '999px', height: '0.5rem', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                backgroundColor: 'var(--primary-color)',
                width: `${(stats.totalStorageUsed / (500 * 1024 * 1024)) * 100}%`
              }} />
            </div>
            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.5rem', textAlign: 'right' }}>
              {((stats.totalStorageUsed / (500 * 1024 * 1024)) * 100).toFixed(1)}% Used
            </p>
          </div>
        </div>

        {/* Charts Container */}
        <div className="card lg:col-span-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Category Distribution</h3>
            {categories.length > 0 ? (
              <div style={{ position: 'relative', height: '220px' }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            ) : (
              <p className="text-muted text-center" style={{ marginTop: '4rem' }}>No data available</p>
            )}
          </div>

          <div>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Storage by Category</h3>
            {categories.length > 0 ? (
              <div style={{ position: 'relative', height: '220px' }}>
                <Bar data={barData} options={barOptions} />
              </div>
            ) : (
               <p className="text-muted text-center" style={{ marginTop: '4rem' }}>No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Recent Uploads</h3>
          <Link to="/files" className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>View All</Link>
        </div>
        
        {recentFiles.length === 0 ? (
          <p className="text-muted text-center" style={{ padding: '2rem 0' }}>No recent files uploaded.</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Size</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentFiles.map(file => (
                  <tr key={file.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.category)}
                        <span style={{ fontWeight: '500', wordBreak: 'break-all' }}>{file.originalFilename}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        backgroundColor: 'var(--bg-color)', padding: '0.3rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '500' 
                      }}>
                        {file.category}
                      </span>
                    </td>
                    <td>{formatSize(file.size)}</td>
                    <td>
                      <span className="flex items-center gap-1 text-muted" style={{ fontSize: '0.85rem' }}>
                        <Clock size={14} /> {new Date(file.uploadDate).toLocaleDateString()}
                      </span>
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

export default Dashboard;
