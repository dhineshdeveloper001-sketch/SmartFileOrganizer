import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Folder, LogOut, X, UploadCloud, Grid, PieChart, User, Settings } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useContext(AuthContext);
  const location = useLocation();

  const sidebarStyle = {
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

  const navItemStyle = (isActive) => ({
    display: 'flex', 
    alignItems: 'center', 
    gap: '1rem', 
    padding: '0.875rem 1rem', 
    borderRadius: 'var(--radius-md)',
    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
    color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
    fontWeight: isActive ? '600' : '500',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
    whiteSpace: 'nowrap'
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
          <NavLink to="/" onClick={onClose} style={({ isActive }) => navItemStyle(isActive)}>
            <LayoutDashboard size={22} style={{ flexShrink: 0 }} />
            <span className="nav-label">Dashboard</span>
          </NavLink>
          <NavLink to="/files" onClick={onClose} style={({ isActive }) => navItemStyle(isActive && location.search === '')}>
            <Folder size={22} style={{ flexShrink: 0 }} />
            <span className="nav-label">My Files</span>
          </NavLink>
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
