import { useEffect, useState } from 'react';
import { getTeams, getUsers, createTeam, updateTeam, deleteTeam } from '../services/api';
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiShield } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import './Teams.css';

function Teams() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [formData, setFormData] = useState({
    team_name: '',
    team_lead: '',
    specialization: '',
  });

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamsRes, usersRes] = await Promise.all([getTeams(), getUsers()]);
      setTeams(teamsRes.data.results || teamsRes.data);
      setUsers(usersRes.data.results || usersRes.data);
    } catch (err) {
      console.error('Failed to load teams', err);
      toast.error('Failed to load teams.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setTargetId(null);
    setFormData({ team_name: '', team_lead: '', specialization: '' });
    setShowModal(true);
  };

  const openEditModal = (team) => {
    setEditMode(true);
    setTargetId(team.team_id);
    setFormData({
      team_name: team.team_name,
      team_lead: team.team_lead || '',
      specialization: team.specialization || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.team_name.trim()) return;
    try {
      const payload = {
        team_name: formData.team_name,
        team_lead: formData.team_lead || null,
        specialization: formData.specialization,
      };
      if (editMode) {
        await updateTeam(targetId, payload);
        toast.success('Team updated successfully!');
      } else {
        await createTeam(payload);
        toast.success('Team created successfully!');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to save team', err);
      toast.error('Error saving team. Check if team name already exists.');
    }
  };

  const handleDelete = (team) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Team',
      message: `Are you sure you want to delete team "${team.team_name}"?`,
      onConfirm: async () => {
        try {
          await deleteTeam(team.team_id);
          loadData();
          toast.success('Team deleted successfully!');
        } catch (err) {
          console.error('Failed to delete team', err);
          toast.error('Error deleting team.');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  if (loading) return <div className="loading">Loading teams…</div>;

  return (
    <div className="teams-container">
      <div className="teams-header">
        <div>
          <h1>Team Management</h1>
          <p className="teams-subtitle">Organize response teams and assign team leads</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <FiPlus /> New Team
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="empty-state-card">
          <FiUsers className="empty-icon" />
          <p>No teams configured yet. Create your first response team.</p>
        </div>
      ) : (
        <div className="teams-grid">
          {teams.map(team => (
            <div key={team.team_id} className="team-card">
              <div className="team-card-header">
                <div className="team-icon"><FiShield /></div>
                <div className="team-actions">
                  <button className="btn-edit" onClick={() => openEditModal(team)} title="Edit">
                    <FiEdit2 />
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(team)} title="Delete">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
              <div className="team-name">{team.team_name}</div>
              <div className="team-meta">
                {team.specialization && (
                  <span className="team-spec-badge">{team.specialization}</span>
                )}
              </div>
              <div className="team-lead-row">
                <span className="team-lead-label">Team Lead:</span>
                <span className="team-lead-value">
                  {team.team_lead_name || <em>Unassigned</em>}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editMode ? 'Edit Team' : 'Create New Team'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label htmlFor="team-name">Team Name *</label>
                <input
                  id="team-name"
                  type="text"
                  placeholder="e.g. Red Team, Incident Response"
                  value={formData.team_name}
                  onChange={e => setFormData({ ...formData, team_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="team-lead">Team Lead</label>
                <select
                  id="team-lead"
                  value={formData.team_lead}
                  onChange={e => setFormData({ ...formData, team_lead: e.target.value || null })}
                >
                  <option value="">— Unassigned —</option>
                  {users.map(u => (
                    <option key={u.user_id} value={u.user_id}>{u.username} ({u.full_name})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="team-spec">Specialization</label>
                <input
                  id="team-spec"
                  type="text"
                  placeholder="e.g. Malware Analysis, Network Forensics"
                  value={formData.specialization}
                  onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  <FiCheck style={{ marginRight: 6 }} /> Save Team
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

export default Teams;
