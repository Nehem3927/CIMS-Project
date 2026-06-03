import { useEffect, useState } from 'react';
import { getResponseActions, getIncidents, deleteResponseAction } from '../services/api';
import { FiZap, FiCheckCircle, FiXCircle, FiTrash2, FiFilter } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import Skeleton from '../components/Skeleton';
import './ResponseActions.css';

function ResponseActions() {
  const [actions, setActions] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [incidentFilter, setIncidentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 15;

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    getIncidents({ page: 1 })
      .then(res => setIncidents(res.data.results || res.data))
      .catch(console.error);
  }, []);

  useEffect(() => { loadActions(); }, [incidentFilter, page]);

  const loadActions = async () => {
    setLoading(true);
    try {
      const params = { incident: incidentFilter || undefined };
      const res = await getResponseActions(params);
      const data = res.data.results || res.data;
      setActions(data);
      setTotalPages(Math.ceil((res.data.count || data.length) / PAGE_SIZE) || 1);
    } catch (err) {
      console.error('Failed to load response actions', err);
      toast.error('Failed to load response actions.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Response Action',
      message: 'Are you sure you want to delete this response action log entry?',
      onConfirm: async () => {
        try {
          await deleteResponseAction(id);
          toast.success('Response action deleted successfully!');
          loadActions();
        } catch (err) {
          toast.error('Error deleting response action.');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="ra-container">
      <div className="ra-header">
        <div>
          <h1>Response Actions</h1>
          <p className="ra-subtitle">All response actions logged across incidents</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="ra-filter-bar">
        <FiFilter className="filter-icon" />
        <select
          value={incidentFilter}
          onChange={e => { setIncidentFilter(e.target.value); setPage(1); }}
          className="ra-select"
        >
          <option value="">All Incidents</option>
          {incidents.map(inc => (
            <option key={inc.incident_id} value={inc.incident_id}>
              #{inc.incident_id} – {inc.title}
            </option>
          ))}
        </select>
      </div>

      <div className="ra-table-wrapper">
        <table className="ra-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Incident</th>
              <th>Action Type</th>
              <th>Performed By</th>
              <th>Outcome</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  <td><Skeleton height="18px" width="40px" /></td>
                  <td><Skeleton height="18px" width="160px" /></td>
                  <td><Skeleton height="22px" width="100px" borderRadius="12px" /></td>
                  <td><Skeleton height="18px" width="80px" /></td>
                  <td><Skeleton height="22px" width="70px" borderRadius="12px" /></td>
                  <td><Skeleton height="26px" width="35px" borderRadius="6px" /></td>
                </tr>
              ))
            ) : actions.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <FiZap className="empty-icon" style={{ fontSize: '40px', opacity: 0.5, marginBottom: '12px' }} />
                    <p>No response actions found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              actions.map(act => (
                <tr key={act.action_id}>
                  <td className="id-cell">#{act.action_id}</td>
                  <td className="incident-cell">
                    <span className="incident-ref">
                      #{act.incident} {act.incident_title ? `– ${act.incident_title}` : ''}
                    </span>
                  </td>
                  <td>
                    <span className="action-type-badge">{act.action_type}</span>
                  </td>
                  <td className="performer-cell">
                    {act.performed_by_name || <em className="text-muted">System</em>}
                  </td>
                  <td>
                    {act.was_successful ? (
                      <span className="outcome-badge success">
                        <FiCheckCircle /> Success
                      </span>
                    ) : (
                      <span className="outcome-badge failure">
                        <FiXCircle /> Failed
                      </span>
                    )}
                  </td>
                  <td>
                    <button className="btn-delete-sm" onClick={() => handleDelete(act.action_id)}>
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >Previous</button>
          <span className="pagination-info">Page {page} of {totalPages}</span>
          <button
            className="pagination-btn"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >Next</button>
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

export default ResponseActions;
