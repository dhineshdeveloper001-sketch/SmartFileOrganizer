import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Search, Menu } from 'lucide-react';

const Navbar = ({ onMenuClick }) => {
  const { user } = useContext(AuthContext);

  return (
    <header style={{ 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 1.5rem',
      backgroundColor: 'var(--card-bg)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 30
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={onMenuClick}
          className="md-hidden"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' }}
        >
          <Menu size={24} style={{ color: 'var(--text-main)' }} />
        </button>
        <div className="search-container" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', width: '100%', maxWidth: '300px' }}>
          <Search size={18} style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }} />
          <input 
            type="text" 
            placeholder="Search files..." 
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--text-main)' }} 
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontWeight: '500', display: 'none' }} className="sm-block">Hello, {user?.username}</span>
        <div style={{ 
          width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', 
          color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 
        }}>
          {user?.username?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
