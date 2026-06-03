import { useEffect, useState } from 'react';
import API from '../services/api';
import { FiShield, FiPlus, FiTrash2, FiRss } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import './Iocs.css';

function Iocs() {
  const [iocs, setIocs] = useState([]);
  const [threatFeeds, setThreatFeeds] = useState([]);
  const [newIoc, setNewIoc] = useState({ ioc_type: '', ioc_value: '', feed_id: '' });

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    loadIocs();
    loadThreatFeeds();
  }, []);

  const loadIocs = async () => {
    try {
      const res = await API.get('/iocs/');
      setIocs(res.data.results || res.data);
    } catch (err) {
      console.error('Error loading IOCs:', err);
      toast.error('Failed to load IOCs.');
    }
  };

  const loadThreatFeeds = async () => {
    try {
      const res = await API.get('/threat-feeds/');
      setThreatFeeds(res.data.results || res.data);
    } catch (err) {
      console.error('Could not load threat feeds', err);
    }
  };

  const handleAdd = async () => {
    if (!newIoc.ioc_type || !newIoc.ioc_value) return;
    try {
      await API.post('/iocs/', newIoc);
      setNewIoc({ ioc_type: '', ioc_value: '', feed_id: '' });
      toast.success('IOC registered successfully!');
      loadIocs();
    } catch (err) {
      toast.error('Failed to register IOC.');
    }
  };

  const handleDelete = (id, value) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Indicator',
      message: `Are you sure you want to delete the indicator "${value}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await API.delete(`/iocs/${id}/`);
          loadIocs();
          toast.success('IOC deleted successfully!');
        } catch (err) {
          toast.error('Failed to delete IOC.');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const getTypeClass = (type) => {
    if (!type) return 'ioc-type-default';
    const t = type.toLowerCase();
    if (t.includes('ip'))     return 'ioc-type-ip';
    if (t.includes('domain')) return 'ioc-type-domain';
    if (t.includes('url'))    return 'ioc-type-url';
    if (t.includes('hash'))   return 'ioc-type-hash';
    if (t.includes('email'))  return 'ioc-type-email';
    return 'ioc-type-default';
  };

  return (
    <div className="iocs-container">
      <div>
        <h1>Indicators of Compromise</h1>
        <p className="iocs-subtitle">Track and manage IOCs from threat intelligence feeds</p>
      </div>

      <div className="add-ioc-card">
        <div className="add-ioc-title">Add New IOC</div>
        <div className="add-ioc">
          <select
            id="ioc-type-select"
            value={newIoc.ioc_type}
            onChange={e => setNewIoc({ ...newIoc, ioc_type: e.target.value })}
          >
            <option value="">Type</option>
            <option value="IP Address">IP Address</option>
            <option value="Domain">Domain</option>
            <option value="URL">URL</option>
            <option value="File Hash (SHA256)">File Hash (SHA256)</option>
            <option value="Email">Email</option>
          </select>
          <input
            id="ioc-value-input"
            type="text"
            placeholder="IOC value (e.g., 185.142.53.45)"
            value={newIoc.ioc_value}
            onChange={e => setNewIoc({ ...newIoc, ioc_value: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <select
            id="ioc-feed-select"
            value={newIoc.feed_id}
            onChange={e => setNewIoc({ ...newIoc, feed_id: e.target.value })}
          >
            <option value="">Source Feed (optional)</option>
            {threatFeeds.map(feed => (
              <option key={feed.feed_id} value={feed.feed_id}>{feed.feed_name}</option>
            ))}
          </select>
          <button id="add-ioc-btn" className="add-ioc-btn" onClick={handleAdd}>
            <FiPlus style={{ marginRight: 6 }} /> Add IOC
          </button>
        </div>
      </div>

      {iocs.length === 0 ? (
        <div className="empty-iocs">No IOCs logged yet. Add your first indicator above.</div>
      ) : (
        <div className="iocs-list">
          {iocs.map(ioc => (
            <div key={ioc.ioc_id} className="ioc-card">
              <div className="ioc-info">
                <span className={`ioc-type ${getTypeClass(ioc.ioc_type)}`}>{ioc.ioc_type}</span>
                <span className="ioc-value">{ioc.ioc_value}</span>
                {ioc.feed_name && (
                  <span className="ioc-feed">
                    <FiRss size={11} /> {ioc.feed_name}
                  </span>
                )}
              </div>
              <button
                className="ioc-delete-btn"
                id={`delete-ioc-${ioc.ioc_id}`}
                onClick={() => handleDelete(ioc.ioc_id, ioc.ioc_value)}
              >
                <FiTrash2 style={{ marginRight: 4 }} /> Delete
              </button>
            </div>
          ))}
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

export default Iocs;