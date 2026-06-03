import { useEffect, useState } from 'react';
import API from '../services/api';
import { FiPlus, FiServer, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import './Assets.css';

function Assets() {
  const [assets, setAssets] = useState([]);
  const [newAsset, setNewAsset] = useState({ app_name: '', app_type: '', ip_address: '', hostname: '' });
  
  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    API.get('/assets/').then(res => setAssets(res.data.results || res.data));
  }, []);

  const handleAdd = async () => {
    if (!newAsset.app_name.trim()) return;
    try {
      await API.post('/assets/', newAsset);
      const res = await API.get('/assets/');
      setAssets(res.data.results || res.data);
      setNewAsset({ app_name: '', app_type: '', ip_address: '', hostname: '' });
      toast.success('Asset added successfully!');
    } catch (err) {
      toast.error('Failed to add asset.');
    }
  };

  const handleDelete = (id, name) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Asset',
      message: `Are you sure you want to delete the asset "${name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await API.delete(`/assets/${id}/`);
          const res = await API.get('/assets/');
          setAssets(res.data.results || res.data);
          toast.success('Asset deleted successfully!');
        } catch (err) {
          toast.error('Failed to delete asset.');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="assets-container">
      <div>
        <h1>Assets</h1>
        <p className="assets-subtitle">Manage infrastructure and application assets</p>
      </div>

      <div className="add-asset-card">
        <div className="add-asset-title">Add New Asset</div>
        <div className="add-asset">
          <input
            id="asset-name"
            placeholder="Name"
            value={newAsset.app_name}
            onChange={e => setNewAsset({ ...newAsset, app_name: e.target.value })}
          />
          <input
            id="asset-type"
            placeholder="Type (e.g. Server, Endpoint)"
            value={newAsset.app_type}
            onChange={e => setNewAsset({ ...newAsset, app_type: e.target.value })}
          />
          <input
            id="asset-ip"
            placeholder="IP Address"
            value={newAsset.ip_address}
            onChange={e => setNewAsset({ ...newAsset, ip_address: e.target.value })}
          />
          <input
            id="asset-hostname"
            placeholder="Hostname"
            value={newAsset.hostname}
            onChange={e => setNewAsset({ ...newAsset, hostname: e.target.value })}
          />
          <button id="add-asset-btn" onClick={handleAdd}>
            <FiPlus style={{ marginRight: 6 }} /> Add Asset
          </button>
        </div>
      </div>

      <div className="assets-list-card">
        <div className="assets-list-header">Registered Assets ({assets.length})</div>
        {assets.length === 0 ? (
          <div className="empty-assets">No assets registered yet. Add your first asset above.</div>
        ) : (
          <ul className="assets-list">
            {assets.map(asset => (
              <li key={asset.app_id} className="asset-list-item-row">
                <div className="asset-item-details">
                  <FiServer style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span className="asset-name">{asset.app_name}</span>
                  {asset.app_type && <span className="asset-type-badge">{asset.app_type}</span>}
                  {asset.ip_address && <span className="asset-ip">{asset.ip_address}</span>}
                  {asset.hostname && <span className="asset-ip">{asset.hostname}</span>}
                </div>
                <button
                  className="asset-delete-btn"
                  onClick={() => handleDelete(asset.app_id, asset.app_name)}
                  title="Delete Asset"
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

export default Assets;