'use client';

import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import api from '@/lib/api';
import { formatSize } from '@/lib/utils';
import { getFileIcon } from '@/lib/fileIcons';
import { downloadFile } from '@/lib/download';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import AppLayout from '@/components/AppLayout';
import { HardDrive, FileText, Database, Image, Film, Clock, Download } from 'lucide-react';
import type { UserStats, FileItem } from '@/types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const categoryColors: Record<string, string> = {
  'Images': '#7c3aed',
  'Videos': '#ef4444',
  'Documents': '#10b981',
  'PDF': '#f97316',
  'Audio': '#3b82f6',
  'Archives': '#f59e0b',
  'Others': '#64748b'
};

interface StatCardProps {
  icon: React.ReactElement<{ style?: React.CSSProperties }>;
  label: string;
  value: string | number;
  bg: string;
  color: string;
}

const StatCard = ({ icon, label, value, bg, color }: StatCardProps) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
    <div style={{ padding: '0.875rem', backgroundColor: bg, borderRadius: 'var(--radius-lg)' }}>
      {React.cloneElement(icon, { style: { color } })}
    </div>
    <div>
      <p className="text-muted" style={{ fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.1rem' }}>{label}</p>
      <h3 style={{ fontSize: '1.5rem', margin: 0, lineHeight: 1.2 }}>{value}</h3>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [statsData, filesData] = await Promise.all([
          api.get<UserStats>('/files/stats'),
          api.get<FileItem[]>('/files')
        ]);
        setStats(statsData);
        setRecentFiles(filesData.slice(0, 5));
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (authLoading || !user) return null;

  if (loading) return (
    <AppLayout>
      <div className="flex justify-center items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner spinner-primary"></div>
      </div>
    </AppLayout>
  );
  
  if (!stats) return (
    <AppLayout>
      <div className="text-danger text-center mt-4">Failed to load dashboard data.</div>
    </AppLayout>
  );

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
      legend: { position: 'right' as const, labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Outfit' } } }
    },
    cutout: '70%'
  };

  const barData = {
    labels: categories,
    datasets: [{
      label: 'Storage Used (MB)',
      data: categories.map(c => ((stats.storageByCategory[c] || 0) / (1024 * 1024)).toFixed(2)),
      backgroundColor: 'rgba(124, 58, 237, 0.8)',
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
        grid: { color: 'var(--border-color)' },
        title: { display: true, text: 'Megabytes (MB)', font: { family: 'Outfit', size: 12 } }
      }
    }
  };

  return (
    <AppLayout>
      <div>
        <h2 className="mb-4">Dashboard Overview</h2>
        
        {/* 6 Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4" style={{ gap: '1.5rem' }}>
          <StatCard 
            icon={<FileText size={24} />} label="Total Files" 
            value={stats.totalFiles} bg="var(--primary-light)" color="var(--primary-color)" 
          />
          <StatCard 
            icon={<Database size={24} />} label="Storage Used" 
            value={formatSize(stats.totalStorageUsed)} bg="var(--success-light)" color="var(--success)" 
          />
          <StatCard 
            icon={<HardDrive size={24} />} label="Available Quota" 
            value={formatSize(Math.max(0, (500 * 1024 * 1024) - stats.totalStorageUsed))} bg="#fef3c7" color="#f59e0b" 
          />
          <StatCard 
            icon={<Image size={24} />} label="Images" 
            value={stats.filesByCategory?.['Images'] || 0} bg="#f3e8ff" color="#9333ea" 
          />
          <StatCard 
            icon={<Film size={24} />} label="Videos" 
            value={stats.filesByCategory?.['Videos'] || 0} bg="#fee2e2" color="#ef4444" 
          />
          <StatCard 
            icon={<FileText size={24} />} label="PDFs" 
            value={stats.filesByCategory?.['PDF'] || 0} bg="#ffedd5" color="#f97316" 
          />
        </div>

        {/* Storage Overview Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4" style={{ gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Category Distribution</h3>
            {categories.length > 0 ? (
              <div style={{ position: 'relative', height: '250px' }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            ) : (
              <p className="text-muted text-center" style={{ marginTop: '4rem' }}>No data available</p>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Storage by Category</h3>
            {categories.length > 0 ? (
              <div style={{ position: 'relative', height: '250px' }}>
                <Bar data={barData} options={barOptions} />
              </div>
            ) : (
               <p className="text-muted text-center" style={{ marginTop: '4rem' }}>No data available</p>
            )}
          </div>
        </div>

        {/* Recent Uploads */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Recent Uploads</h3>
          
          {recentFiles.length === 0 ? (
            <p className="text-muted text-center" style={{ padding: '2rem 0' }}>No recent files uploaded.</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Category</th>
                    <th>Size</th>
                    <th>Upload Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentFiles.map(file => (
                    <tr key={file.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.category, 20)}
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
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => downloadFile(file.id, file.originalFilename)} 
                          className="btn btn-outline text-primary" 
                          style={{ padding: '0.3rem 0.5rem', borderColor: 'var(--primary-color)' }} 
                          title="Download"
                        >
                          <Download size={14} /> Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
