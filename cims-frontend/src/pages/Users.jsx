import { useEffect, useState } from 'react';
import { getUsers, getRoles, createUser, updateUser, deleteUser } from '../services/api';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import './Users.css';

function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [targetUserId, setTargetUserId] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    phone_number: '',
    role: '',
  });

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([getUsers(), getRoles()]);
      setUsers(usersRes.data.results || usersRes.data);
      setRoles(rolesRes.data.results || rolesRes.data);
    } catch (err) {
      console.error('Failed to load user management data', err);
      toast.error('Failed to load users data.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (roleId) => {
    const roleObj = roles.find(r => r.role_id === roleId);
    return roleObj ? roleObj.role_name : 'Unknown';
  };

  const openAddModal = () => {
    setEditMode(false);
    setTargetUserId(null);
    setFormData({
      username: '',
      full_name: '',
      phone_number: '',
      role: roles[0]?.role_id || '',
    });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditMode(true);
    setTargetUserId(user.user_id);
    setFormData({
      username: user.username,
      full_name: user.full_name,
      phone_number: user.phone_number || '',
      role: user.role || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.full_name.trim()) {
      toast.error('Username and Full Name are required.');
      return;
    }
    try {
      if (editMode) {
        await updateUser(targetUserId, formData);
        toast.success('User updated successfully!');
      } else {
        await createUser(formData);
        toast.success('User created successfully!');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to save user', err);
      toast.error('Error saving user data. Check if username already exists.');
    }
  };

  const handleDelete = (user) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete User Account',
      message: `Are you sure you want to delete user @${user.username}? This will also delete their Django auth account and cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteUser(user.user_id);
          loadData();
          toast.success('User deleted successfully!');
        } catch (err) {
          console.error('Failed to delete user', err);
          toast.error('Error deleting user.');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  if (loading) return <div className="loading">Loading user management…</div>;

  return (
    <div className="users-container">
      <div className="users-header">
        <div>
          <h1>User Management</h1>
          <p className="users-subtitle">Configure CIMS roles and user profiles</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <FiPlus /> Add User
        </button>
      </div>

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Phone Number</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <FiUsers />
                    <p>No users found. Click "Add User" to create one.</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.user_id}>
                  <td className="id-cell">#{u.user_id}</td>
                  <td className="username-cell">@{u.username}</td>
                  <td className="fullname-cell">{u.full_name}</td>
                  <td>
                    <span className={`role-badge role-${getRoleName(u.role).toLowerCase()}`}>
                      {getRoleName(u.role)}
                    </span>
                  </td>
                  <td className="phone-cell">{u.phone_number || 'N/A'}</td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn-edit" onClick={() => openEditModal(u)} title="Edit User Role">
                        <FiEdit2 /> Edit
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(u)} title="Delete User">
                        <FiTrash2 /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editMode ? 'Edit User Role' : 'Add New User'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label htmlFor="modal-username">Username</label>
                <input
                  id="modal-username"
                  type="text"
                  disabled={editMode}
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. jsmith"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-fullname">Full Name</label>
                <input
                  id="modal-fullname"
                  type="text"
                  disabled={editMode}
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Jane Smith"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-phone">Phone Number (optional)</label>
                <input
                  id="modal-phone"
                  type="text"
                  disabled={editMode}
                  value={formData.phone_number}
                  onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="e.g. +1-555-0199"
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-role">CIMS Role</label>
                <select
                  id="modal-role"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: Number(e.target.value) })}
                >
                  {roles.map(r => (
                    <option key={r.role_id} value={r.role_id}>
                      {r.role_name}
                    </option>
                  ))}
                </select>
              </div>

              {!editMode && (
                <div className="pwd-note">
                  <strong>Note:</strong> New users are created with a default password of <code>cimsdefault123</code>.
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  <FiCheck style={{ marginRight: 6 }} /> Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default Users;
