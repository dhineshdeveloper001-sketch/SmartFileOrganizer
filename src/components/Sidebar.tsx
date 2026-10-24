'use client';

import React, { useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Folder, LogOut, X, Shield } from 'lucide-react';
import { AuthContext } from '@/context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { logout, user } = useContext(AuthContext);
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const sidebarStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--card-bg)',
    borderRight: '1px solid var(--border-color)',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: isOpen ? 0 : '-260px',
    zIndex: 50,
    transition: 'all 0.3s ease-in-out',
  };

  const navItemStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', 
    alignItems: 'center', 
    gap: '1rem', 
    padding: '0.875rem 1rem', 
    borderRadius: 'var(--radius-md)',
    backgroundColor: active ? 'var(--primary-light)' : 'transparent',
    color: active ? 'var(--primary-color)' : 'var(--text-muted)',
    fontWeight: active ? '600' : '500',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
  });

  return (
    <>
      <style>{`
        .sidebar-container {
          width: 260px;
        }
        .nav-label { display: block; }
        
        @media (min-width: 768px) and (max-width: 1023px) {
          .sidebar-container {
            width: 80px;
            left: 0 !important;
          }
          .nav-label { display: none; }
          .sidebar-logo-text { display: none; }
        }
        
        @media (min-width: 1024px) {
          .sidebar-container {
            position: relative !important;
            left: 0 !important;
            width: 260px;
          }
        }
      `}</style>
      <div style={sidebarStyle} className="sidebar-container">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: 'var(--primary-color)', fontSize: '1.2rem', margin: 0, lineHeight: 1.2, whiteSpace: 'nowrap' }} className="sidebar-logo-text">
            Smart File Organizer
          </h2>
          {/* Logo icon for tablet view */}
          <div className="md-hidden lg:hidden" style={{ display: 'none', margin: '0 auto' }}>
            <Folder size={28} style={{ color: 'var(--primary-color)' }} />
          </div>
          <button 
            onClick={onClose} 
            className="md-hidden" 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', overflowX: 'hidden' }}>
          <Link href="/" onClick={onClose} style={navItemStyle(isActive('/') && pathname === '/')}>
            <LayoutDashboard size={22} style={{ flexShrink: 0 }} />
            <span className="nav-label">Dashboard</span>
          </Link>
          <Link href="/files" onClick={onClose} style={navItemStyle(pathname === '/files')}>
            <Folder size={22} style={{ flexShrink: 0 }} />
            <span className="nav-label">My Files</span>
          </Link>
          {user?.role === 'ROLE_ADMIN' && (
            <Link href="/admin" onClick={onClose} style={navItemStyle(pathname.startsWith('/admin'))}>
              <Shield size={22} style={{ flexShrink: 0, color: 'var(--danger)' }} />
              <span className="nav-label" style={{ color: 'var(--danger)' }}>Admin Panel</span>
            </Link>
          )}
        </nav>

        <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--border-color)' }}>
          <button onClick={logout} className="btn" style={{ width: '100%', color: 'var(--danger)', backgroundColor: 'var(--danger-light)', border: 'none', justifyContent: 'flex-start', padding: '0.875rem 1rem', overflow: 'hidden' }}>
            <LogOut size={22} style={{ flexShrink: 0 }} />
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
