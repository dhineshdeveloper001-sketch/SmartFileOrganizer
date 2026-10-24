'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Search, Edit2, Trash2, Plus, X, User } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import AdminLayout from '@/components/AdminLayout';
import type { UserItem } from '@/types';

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuthGuard();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<{ id: number | null; username: string; password: string; role: string }>({
    id: null,
    username: '',
    password: '',
    role: 'ROLE_USER',
  });
  const [formError, setFormError] = useState('');

  const fetchUsers = async () => {
    try {
      const data = await api.get<UserItem[]>('/admin/users');
      setUsers(data);
    } catch (err: unknown) {
      console.error('Failed to fetch users', err);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ROLE_ADMIN') {
      fetchUsers();
    }
  }, [user]);

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({ id: null, username: '', password: '', role: 'ROLE_USER' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (targetUser: UserItem) => {
    setModalMode('edit');
    setFormData({ id: targetUser.id, username: targetUser.username, password: '', role: targetUser.role });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setFormError(e.response?.data?.message || e.message || 'Action failed');
    }
  };

  const handleDelete = async (id: number, username: string) => {
    if (
      window.confirm(
        `Are you sure you want to completely delete user '${username}'?\n\nWARNING: This will permanently delete all of their files from the system!`
      )
    ) {
      try {
        await api.delete(`/admin/users/${id}`);
        alert('User deleted successfully');
        fetchUsers();
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        alert(e.response?.data?.message || e.message || 'Delete failed');
      }
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || !user) return null;

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h2>Manage Users</h2>
        <button onClick={handleOpenAdd} className="btn flex items-center gap-2">
          <Plus size={18} /> Add New User
        </button>
      </div>

      <div className="card mb-4" style={{ padding: '1rem' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Search users by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
          <p className="text-muted" style={{ textAlign: 'center', padding: '3rem 0' }}>
            No users found matching your criteria.
          </p>
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
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            padding: '0.4rem',
                            backgroundColor: 'var(--bg-color)',
                            borderRadius: '50%',
                            display: 'flex',
                          }}
                        >
                          <User size={16} />
                        </div>
                        <span style={{ fontWeight: '500' }}>{u.username}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          backgroundColor:
                            u.role === 'ROLE_ADMIN' ? 'var(--danger-light)' : 'var(--primary-light)',
                          color: u.role === 'ROLE_ADMIN' ? 'var(--danger)' : 'var(--primary-color)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>{u.totalFiles}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="btn btn-outline"
                          style={{ padding: '0.4rem' }}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.username)}
                          className="btn btn-danger"
                          style={{ padding: '0.4rem' }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '450px', position: 'relative' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ margin: 0 }}>
                {modalMode === 'add' ? 'Add New User' : `Edit User: ${formData.username}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  color: 'var(--danger)',
                  backgroundColor: 'var(--danger-light)',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Password {modalMode === 'edit' && <span className="text-muted">(leave blank to keep unchanged)</span>}
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={modalMode === 'add'}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="ROLE_USER">User (Standard)</option>
                  <option value="ROLE_ADMIN">Admin (Full Control)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalMode === 'add' ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
