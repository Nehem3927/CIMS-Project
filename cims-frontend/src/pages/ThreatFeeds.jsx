import { useEffect, useState } from 'react';
import API from '../services/api';
import { FiPlus, FiTrash2, FiRss } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import './ThreatFeeds.css';

function ThreatFeeds() {
  const [feeds, setFeeds] = useState([]);
  const [newFeed, setNewFeed] = useState({ feed_name: '', source_url: '' });

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async () => {
    try {
      const res = await API.get('/threat-feeds/');
      setFeeds(res.data.results || res.data);
    } catch (err) {
      console.error('Error loading feeds:', err);
      toast.error('Failed to load threat feeds.');
    }
  };

  const handleAdd = async () => {
    if (!newFeed.feed_name.trim()) return;
    try {
      await API.post('/threat-feeds/', newFeed);
      toast.success('Threat feed added successfully!');
      loadFeeds();
      setNewFeed({ feed_name: '', source_url: '' });
    } catch (err) {
      toast.error('Failed to add threat feed.');
    }
  };

  const handleDelete = (id, name) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Threat Feed',
      message: `Are you sure you want to delete threat feed "${name}"?`,
      onConfirm: async () => {
        try {
          await API.delete(`/threat-feeds/${id}/`);
          loadFeeds();
          toast.success('Threat feed deleted successfully!');
        } catch (err) {
          toast.error('Failed to delete threat feed.');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="threat-feeds-container">
      <div>
        <h1>Threat Feeds</h1>
        <p className="threat-feeds-subtitle">Manage threat intelligence feeds</p>
      </div>

      <div className="add-feed-card">
        <div className="add-feed-title">Add New Threat Feed</div>
        <div className="add-feed">
          <input
            id="feed-name"
            placeholder="Feed Name"
            value={newFeed.feed_name}
            onChange={e => setNewFeed({ ...newFeed, feed_name: e.target.value })}
          />
          <input
            id="feed-url"
            placeholder="Source URL"
            value={newFeed.source_url}
            onChange={e => setNewFeed({ ...newFeed, source_url: e.target.value })}
          />
          <button id="add-feed-btn" onClick={handleAdd}>
            <FiPlus style={{ marginRight: 6 }} /> Add Feed
          </button>
        </div>
      </div>

      <div className="feeds-list-card">
        <div className="feeds-list-header">Active Feeds ({feeds.length})</div>
        {feeds.length === 0 ? (
          <div className="empty-feeds">No threat feeds configured yet. Add your first feed above.</div>
        ) : (
          <ul className="feeds-list">
            {feeds.map(feed => (
              <li key={feed.feed_id}>
                <FiRss style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <div className="feed-content">
                  <span className="feed-name">{feed.feed_name}</span>
                  {feed.source_url && <span className="feed-url">{feed.source_url}</span>}
                </div>
                <button
                  className="delete-feed-btn"
                  onClick={() => handleDelete(feed.feed_id, feed.feed_name)}
                  title="Delete feed"
                >
                  <FiTrash2 />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

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
export default ThreatFeeds;
