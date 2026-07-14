import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Search, Menu, Bell } from 'lucide-react';

const Navbar = ({ onMenuClick }) => {
  const { user } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/files?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/files`);
    }
  };

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
        <button 
          onClick={onMenuClick}
          className="md-hidden"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' }}
        >
          <Menu size={24} style={{ color: 'var(--text-main)' }} />
        </button>
        
        {/* Mobile Logo */}
        <div className="md-hidden" style={{ fontWeight: '600', color: 'var(--primary-color)', fontSize: '1.2rem', whiteSpace: 'nowrap' }}>
          SFO
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '400px', display: 'none' }} className="sm-block">
          <div className="search-container" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', padding: '0.6rem 1rem', width: '100%', border: '1px solid var(--border-color)' }}>
            <Search size={18} style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }} />
            <input 
              type="text" 
              placeholder="Search files..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--text-main)' }} 
            />
          </div>
        </form>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
          <Bell size={22} />
          <span style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', backgroundColor: 'var(--danger)', borderRadius: '50%' }}></span>
        </button>
        
        <div style={{ 
          width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', 
          color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', flexShrink: 0, cursor: 'pointer' 
        }}>
          {user?.username?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
