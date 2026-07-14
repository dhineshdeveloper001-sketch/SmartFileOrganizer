import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Folder, User, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
  const { logout } = useContext(AuthContext);

  return (
    <div style={{ width: '250px', display: 'flex', flexDirection: 'column' }} className="sidebar-glass">
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
        <h2 style={{ color: 'var(--primary-color)' }}>Smart File<br/>Organizer</h2>
      </div>
      
      <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <NavLink to="/" style={({ isActive }) => ({
          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
          backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
          color: isActive ? 'var(--primary-color)' : 'var(--text-main)'
        })}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/files" style={({ isActive }) => ({
          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
          backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
          color: isActive ? 'var(--primary-color)' : 'var(--text-main)'
        })}>
          <Folder size={20} />
          <span>File Manager</span>
        </NavLink>
      </nav>

      <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--glass-border)' }}>
        <button onClick={logout} className="btn" style={{ width: '100%', color: 'var(--text-main)' }}>
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
