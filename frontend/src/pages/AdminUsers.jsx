import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Search, Edit2, Trash2, Plus, X, User } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({ id: null, username: '', password: '', role: 'ROLE_USER' });
  const [formError, setFormError] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({ id: null, username: '', password: '', role: 'ROLE_USER' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setModalMode('edit');
    setFormData({ id: user.id, username: user.username, password: '', role: user.role });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (modalMode === 'add') {
        if (!formData.username || !formData.password) {
          setFormError('Username and password are required');
          return;
        }
        await api.post('/admin/users', formData);
        alert('User created successfully');
      } else {
        await api.put(`/admin/users/${formData.id}`, formData);
        alert('User updated successfully');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id, username) => {
    if (window.confirm(`Are you sure you want to completely delete user '${username}'?\n\nWARNING: This will permanently delete all of their files from the system!`)) {
      try {
        await api.delete(`/admin/users/${id}`);
        alert('User deleted successfully');
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.message || 'Delete failed');
      }
    }
  };

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h2>Manage Users</h2>
        <button onClick={handleOpenAdd} className="btn flex items-center gap-2">
          <Plus size={18} /> Add New User
        </button>
      </div>

      <div className="card mb-4" style={{ padding: '1rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search users by name..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center" style={{ padding: '3rem 0' }}>
            <div className="spinner spinner-primary"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="text-muted text-center" style={{ padding: '3rem 0' }}>No users found.</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Total Files</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{ padding: '0.4rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', borderRadius: '50%' }}>
                          <User size={18} />
                        </div>
                        <span style={{ fontWeight: '500' }}>{u.username}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        backgroundColor: u.role === 'ROLE_ADMIN' ? 'var(--danger-light)' : 'var(--bg-color)',
                        color: u.role === 'ROLE_ADMIN' ? 'var(--danger)' : 'var(--text-main)',
                        padding: '0.3rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '600' 
                      }}>
                        {u.role === 'ROLE_ADMIN' ? 'ADMIN' : 'USER'}
                      </span>
                    </td>
                    <td>{u.totalFiles}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => handleOpenEdit(u)} className="btn btn-outline" style={{ padding: '0.4rem', marginRight: '0.5rem' }} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(u.id, u.username)} className="btn btn-danger" style={{ padding: '0.4rem' }} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', margin: 0 }}>
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ margin: 0 }}>{modalMode === 'add' ? 'Add New User' : 'Edit User'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            
            {formError && <div className="text-danger mb-3" style={{ fontSize: '0.9rem' }}>{formError}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input type="text" className="form-input" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">{modalMode === 'add' ? 'Password' : 'New Password (leave blank to keep current)'}</label>
                <input type="password" className="form-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={modalMode === 'add'} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="ROLE_USER">User</option>
                  <option value="ROLE_ADMIN">Admin</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
