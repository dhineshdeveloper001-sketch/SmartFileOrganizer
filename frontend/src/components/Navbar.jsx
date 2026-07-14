import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Search } from 'lucide-react';

const Navbar = () => {
  const { user } = useContext(AuthContext);

  return (
    <header style={{ 
      backgroundColor: 'var(--card-bg)', 
      borderBottom: '1px solid var(--border-color)', 
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', width: '300px' }}>
        <Search size={18} style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }} />
        <input 
          type="text" 
          placeholder="Search files..." 
          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.875rem' }} 
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontWeight: '500' }}>Hello, {user?.username}</span>
        <div style={{ 
          width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', 
          color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' 
        }}>
          {user?.username?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
