import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Folder, LogOut, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useContext(AuthContext);

  const sidebarStyle = {
    width: '260px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--card-bg)',
    borderRight: '1px solid var(--border-color)',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: isOpen ? 0 : '-260px',
    zIndex: 50,
    transition: 'left 0.3s ease-in-out',
  };

  return (
    <>
      <style>{`
        @media (min-width: 768px) {
          .sidebar-responsive {
            position: relative !important;
            left: 0 !important;
          }
        }
      `}</style>
      <div style={sidebarStyle} className="sidebar-responsive">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: 'var(--primary-color)', fontSize: '1.5rem', margin: 0, lineHeight: 1.2 }}>Smart File<br/>Organizer</h2>
          <button 
            onClick={onClose} 
            className="md-hidden" 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <NavLink to="/" onClick={onClose} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)',
            backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
            color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: isActive ? '600' : '500',
            transition: 'all 0.2s ease'
          })}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/files" onClick={onClose} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)',
            backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
            color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
            fontWeight: isActive ? '600' : '500',
            transition: 'all 0.2s ease'
          })}>
            <Folder size={20} />
            <span>File Manager</span>
          </NavLink>
        </nav>

        <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--border-color)' }}>
          <button onClick={logout} className="btn" style={{ width: '100%', color: 'var(--danger)', backgroundColor: 'var(--danger-light)', border: 'none' }}>
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
