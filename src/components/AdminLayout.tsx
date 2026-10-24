'use client';

import React, { useContext, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, LogOut, Menu, X, Settings } from 'lucide-react';
import { AuthContext } from '@/context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { logout, user } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItemStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex', 
    alignItems: 'center', 
    gap: '1rem', 
    padding: '0.875rem 1rem', 
    borderRadius: 'var(--radius-md)',
    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
    color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
    fontWeight: isActive ? '600' : '500',
    transition: 'all 0.2s ease',
    textDecoration: 'none'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="md-hidden"
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <div style={{
        width: '260px',
        backgroundColor: 'var(--card-bg)',
        borderRight: '1px solid var(--border-color)',
        height: '100vh',
        position: 'fixed',
        left: sidebarOpen ? 0 : '-260px',
        zIndex: 50,
        transition: 'all 0.3s ease-in-out',
        display: 'flex',
        flexDirection: 'column'
      }} className="admin-sidebar">
        
        <style>{`
          @media (min-width: 1024px) {
            .admin-sidebar { left: 0 !important; position: relative !important; }
            .admin-menu-btn { display: none !important; }
          }
        `}</style>

        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="flex items-center gap-2">
            <Settings size={24} style={{ color: 'var(--danger)' }} />
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.2rem', margin: 0, fontWeight: '700' }}>Admin Panel</h2>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md-hidden" style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link href="/admin" onClick={() => setSidebarOpen(false)} style={navItemStyle(pathname === '/admin')}>
            <LayoutDashboard size={22} />
            <span>Dashboard</span>
          </Link>
          <Link href="/admin/users" onClick={() => setSidebarOpen(false)} style={navItemStyle(pathname === '/admin/users')}>
            <Users size={22} />
            <span>Users</span>
          </Link>
          <Link href="/admin/files" onClick={() => setSidebarOpen(false)} style={navItemStyle(pathname === '/admin/files')}>
            <FileText size={22} />
            <span>All Files</span>
          </Link>
        </nav>

        <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--border-color)' }}>
          <button onClick={handleLogout} className="btn" style={{ width: '100%', color: 'var(--danger)', backgroundColor: 'var(--danger-light)', border: 'none', justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>
            <LogOut size={22} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Admin Navbar */}
        <header style={{ 
          padding: '1rem 1.5rem', backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 30
        }}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="admin-menu-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              <Menu size={24} style={{ color: 'var(--text-main)' }} />
            </button>
            <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>
              Logged in as: <span style={{ color: 'var(--primary-color)' }}>{user?.username}</span> (Admin)
            </span>
          </div>
          
          <button onClick={() => router.push('/')} className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
            Back to User App
          </button>
        </header>

        {/* Page Content */}
        <main style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
