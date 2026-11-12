import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import {
  getIncident, addIncidentUpdate, uploadEvidence,
  getAssets, getIocs, linkAsset, linkIoc, unlinkAsset, unlinkIoc,
  deleteMetric,
  createResponseAction, deleteResponseAction,
} from '../services/api';
import { FiArrowLeft, FiPlus, FiTrash2, FiDownload, FiEye, FiFileText } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import './IncidentDetail.css';

// ── Evidence preview helper ───────────────────────────────
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
const PDF_EXT = 'pdf';
const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';
const mediaBase = apiBase.replace('/api/', '/media/');

function getExt(filePath) {
  return (filePath || '').split('.').pop().toLowerCase();
}

function EvidencePreview({ ev, onPreviewPdf }) {
  const url = `${mediaBase}${ev.file_path}`;
  const ext = getExt(ev.file_path);
  const fileName = ev.file_path.split('/').pop();

  if (IMAGE_EXTS.includes(ext)) {
    return (
      <div className="evidence-preview-item">
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img src={url} alt={fileName} className="evidence-thumbnail" />
        </a>
        <div className="evidence-filename">{fileName}</div>
      </div>
    );
  }

  if (ext === PDF_EXT) {
    return (
      <div className="evidence-preview-item evidence-pdf">
        <div className="pdf-thumbnail-placeholder" onClick={() => onPreviewPdf(url, fileName)}>
          <FiFileText size={32} style={{ color: '#ef4444', marginBottom: 8 }} />
          <button className="btn-preview-pdf">
            <FiEye style={{ marginRight: 4 }} /> Preview PDF
          </button>
        </div>
        <div className="evidence-filename">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <FiDownload style={{ marginRight: 4 }} />{fileName}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="evidence-preview-item evidence-file">
      <div className="file-thumbnail-placeholder">
        <FiFileText size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
        <a href={url} target="_blank" rel="noopener noreferrer" download className="btn-download-file">
          <FiDownload style={{ marginRight: 4 }} /> Download
        </a>
      </div>
      <div className="evidence-filename">{fileName}</div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
const TABS = ['updates', 'evidence', 'actions', 'assets', 'iocs', 'metrics'];

function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [incident, setIncident] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('updates');
  const [playbooks, setPlaybooks] = useState([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  // Updates
  const [updateMsg, setUpdateMsg] = useState('');

  // Evidence
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [pdfPreviewName, setPdfPreviewName] = useState('');

  // Assets
  const [allAssets, setAllAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [impactType, setImpactType] = useState('');

  // IOCs
  const [allIocs, setAllIocs] = useState([]);
  const [selectedIoc, setSelectedIoc] = useState('');
  const [selectedMatchedApp, setSelectedMatchedApp] = useState('');

  // Metrics
  const [metricType, setMetricType] = useState('Time to Detect');
  const [metricValue, setMetricValue] = useState('');

  // Response Actions
  const [actionType, setActionType] = useState('');
  const [customActionType, setCustomActionType] = useState('');
  const [actionTarget, setActionTarget] = useState('');
  const [actionSuccess, setActionSuccess] = useState('true');

  // Confirm Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  useEffect(() => {
    API.get('/playbooks/')
      .then(res => {
        // Check if Django returned paginated data (an object with 'results')
        const playbooksData = res.data.results ? res.data.results : res.data;
        setPlaybooks(playbooksData);
      })
      .catch(err => {
        console.error('Failed to fetch playbooks:', err);
        toast.error('Failed to load playbooks');
      });
  }, []);

  useEffect(() => {
    setIncident(null);
    setError(null);
    loadIncident();
    loadAssets();
    loadIocs();
  }, [id]);

  const handleRunPlaybook = async () => {
    if (!selectedPlaybook) return;
    setIsExecuting(true);
    try {
      const res = await API.post(`/incidents/${id}/execute_playbook/`, { playbook_id: selectedPlaybook });
      toast.success(res.data.message);
      setSelectedPlaybook('');
      loadIncident();
    } catch (err) {
      toast.error('Failed to execute playbook');
    } finally {
      setIsExecuting(false);
    }
  };

  const loadIncident = async () => {
    try {
      const res = await getIncident(id);
      setIncident(res.data);
      console.log('INCIDENT DATA FROM BACKEND:', res.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load incident:', err);
      setError('Incident not found or backend error.');
    }
  };

  const loadAssets = async () => {
    const res = await getAssets();
    setAllAssets(res.data.results || res.data);
  };

  const loadIocs = async () => {
    const res = await getIocs();
    setAllIocs(res.data.results || res.data);
  };

  // ── Update handlers ─────────────────────────────────────
  const handleAddUpdate = async () => {
    if (!updateMsg.trim()) return;
    try {
      await addIncidentUpdate(id, updateMsg);
      setUpdateMsg('');
      loadIncident();
      toast.success('Incident update added.');
    } catch (err) {
      toast.error('Failed to add update.');
    }
  };

  // ── Evidence handlers ───────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    const uploadToast = toast.loading('Uploading evidence file...');
    try {
      await uploadEvidence(id, selectedFile);
      setSelectedFile(null);
      const fileInput = document.getElementById('evidence-file-input');
      if (fileInput) fileInput.value = '';
      loadIncident();
      toast.success('Evidence uploaded successfully!', { id: uploadToast });
    } catch (err) {
      toast.error('Upload failed.', { id: uploadToast });
    } finally {
      setUploading(false);
    }
  };

  // ── Asset handlers ──────────────────────────────────────
  const handleLinkAsset = async () => {
    if (!selectedAsset) return;
    try {
      await linkAsset({ incident: id, app: selectedAsset, impact_type: impactType || 'Affected' });
      setSelectedAsset('');
      setImpactType('');
      loadIncident();
      toast.success('Asset linked successfully!');
    } catch (err) {
      toast.error('Failed to link asset.');
    }
  };

  const handleUnlinkAsset = (assetId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Unlink Asset',
      message: 'Are you sure you want to unlink this asset from this incident?',
      onConfirm: async () => {
        try {
          await unlinkAsset(assetId);
          loadIncident();
          toast.success('Asset unlinked successfully!');
        } catch (err) {
          toast.error('Failed to unlink asset.');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // ── IOC handlers ────────────────────────────────────────
  const handleLinkIoc = async () => {
    if (!selectedIoc) return;
    try {
      await linkIoc({ incident: id, ioc: selectedIoc, matched_app: selectedMatchedApp || null });
      setSelectedIoc('');
      setSelectedMatchedApp('');
      loadIncident();
      toast.success('IOC linked successfully!');
    } catch (err) {
      toast.error('Failed to link IOC.');
    }
  };

  const handleUnlinkIoc = (iocId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Unlink IOC',
      message: 'Are you sure you want to unlink this IOC from this incident?',
      onConfirm: async () => {
        try {
          await unlinkIoc(iocId);
          loadIncident();
          toast.success('IOC unlinked successfully!');
        } catch (err) {
          toast.error('Failed to unlink IOC.');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // ── Metrics handlers ────────────────────────────────────
  const handleAddMetric = async () => {
    if (!metricValue) return;
    try {
      await API.post('/metrics-log/', {
        incident: id,
        metric_type: metricType,
        value_numeric: parseFloat(metricValue),
      });
      toast.success('Metric added successfully');
      setMetricValue('');
      loadIncident();
    } catch (err) {
      toast.error('Failed to add metric');
    }
  };

  const handleDeleteMetric = (metricId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Metric Entry',
      message: 'Are you sure you want to delete this metric entry?',
      onConfirm: async () => {
        try {
          await deleteMetric(metricId);
          loadIncident();
          toast.success('Metric entry deleted.');
        } catch (err) {
          toast.error('Error deleting metric.');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // ── Response Action handlers ──────────────────────────────
  const handleAddAction = async () => {
    const finalType = actionType === 'Other' ? customActionType : actionType;
    if (!finalType.trim()) return;
    try {
      await createResponseAction({
        incident: id,
        action_type: finalType,
        target: actionTarget || null,
        was_successful: actionSuccess === 'true',
      });
      setActionType('');
      setCustomActionType('');
      setActionTarget('');
      setActionSuccess('true');
      loadIncident();
      toast.success('Response action logged.');
    } catch (err) {
      toast.error('Error adding response action.');
    }
  };

  const handleDeleteAction = (actionId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Response Action Log',
      message: 'Are you sure you want to delete this response action log?',
      onConfirm: async () => {
        try {
          await deleteResponseAction(actionId);
          loadIncident();
          toast.success('Response action log deleted.');
        } catch (err) {
          toast.error('Error deleting response action.');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  if (error) {
    return (
      <div className="loading">
        <p>{error}</p>
        <button className="btn-primary" onClick={() => navigate('/incidents')}>
          Back to Incidents
        </button>
      </div>
    );
  }

  if (!incident) return <div className="loading">Loading incident…</div>;

  const updates = Array.isArray(incident.updates) ? incident.updates : [];
  const evidenceList = Array.isArray(incident.evidence_list) ? incident.evidence_list : [];
  const assets = Array.isArray(incident.assets) ? incident.assets : [];
  const actions = Array.isArray(incident.actions) ? incident.actions : [];
  const incidentIocs = Array.isArray(incident.incident_iocs) ? incident.incident_iocs : [];
  const metricsLog = Array.isArray(incident.metrics_log) ? incident.metrics_log : [];

  return (
    <div className="incident-detail-container">
      <button className="detail-back-btn" onClick={() => navigate('/incidents')}>
        <FiArrowLeft /> Back to Incidents
      </button>

      <h1>{incident.title}</h1>

      <div className="incident-meta-grid">
        {[
          ['Status',         incident.status_name],
          ['Priority',       incident.priority_level || 'N/A'],
          ['Category',       incident.category_name],
          ['Reported By',    incident.reported_by_name || 'System'],
          ['Assigned To',    incident.assigned_to_name || 'Unassigned'],
          ['Team',           incident.assigned_team_name || 'Unassigned'],
          ['Detection Date', new Date(incident.detection_date).toLocaleString()],
          ['Resolved Date',  incident.resolved_date
            ? new Date(incident.resolved_date).toLocaleString()
            : 'Not resolved'],
        ].map(([label, value]) => (
          <div className="meta-item" key={label}>
            <div className="meta-label">{label}</div>
            <div className="meta-value">{value}</div>
          </div>
        ))}
      </div>

      <div className="incident-description">
        <div className="section-label">Description</div>
        <p>{incident.description || 'No description provided.'}</p>
      </div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      {/* Tabs Navigation */}
      <div className="tabs">
        <button className={activeTab === 'updates' ? 'tab-active' : ''} onClick={() => setActiveTab('updates')}>Updates</button>
        <button className={activeTab === 'evidence' ? 'tab-active' : ''} onClick={() => setActiveTab('evidence')}>Evidence</button>
        <button className={activeTab === 'actions' ? 'tab-active' : ''} onClick={() => setActiveTab('actions')}>Actions</button>
        <button className={activeTab === 'assets' ? 'tab-active' : ''} onClick={() => setActiveTab('assets')}>Assets</button>
        <button className={activeTab === 'iocs' ? 'tab-active' : ''} onClick={() => setActiveTab('iocs')}>IOCs</button>
        <button className={activeTab === 'metrics' ? 'tab-active' : ''} onClick={() => setActiveTab('metrics')}>Metrics</button>
      </div>

      {/* TAB: UPDATES */}
      {activeTab === 'updates' && (
        <div className="tab-content">
          {incident.updates && incident.updates.length > 0 ? (
            <ul className="update-list">
              {incident.updates.map(up => (
                <li key={up.update_id}>
                  <strong>{up.updated_by_name || 'System'}</strong>{' '}{'\u2013'}{' '}{up.update_message}
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginLeft: '10px' }}>
                    ({new Date(up.changed_at).toLocaleString()})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>No updates have been logged for this incident yet.</p>
          )}

          <div className="add-update">
            <input type="text" placeholder="Add a new update..." value={updateMsg} onChange={e => setUpdateMsg(e.target.value)} />
            <button onClick={handleAddUpdate}>Add Update</button>
          </div>
        </div>
      )}

      {/* TAB: ACTIONS */}
      {activeTab === 'actions' && (
        <div className="tab-content">
          {/* Run Playbook Box */}
          <div style={{
            background: 'var(--bg-elevated)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap',
            border: '1px solid var(--border)'
          }}>
            <h4 style={{ color: 'var(--accent-primary)', margin: 0, flexBasis: '100%' }}>{'\u26A1'} Run Playbook</h4>
            <select
              value={selectedPlaybook}
              onChange={e => setSelectedPlaybook(e.target.value)}
              style={{
                padding: '10px',
                borderRadius: '8px',
                flex: 1,
                minWidth: '200px',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)'
              }}
            >
              <option value="">Select a playbook to execute...</option>
              {playbooks?.map(p => (
                <option key={p.playbook_id} value={p.playbook_id}>{p.playbook_name}</option>
              ))}
            </select>
            <button
              onClick={handleRunPlaybook}
              disabled={!selectedPlaybook || isExecuting}
              className="btn-primary"
              style={{ padding: '10px 20px', opacity: (!selectedPlaybook || isExecuting) ? 0.5 : 1 }}
            >
              {isExecuting ? 'Executing...' : 'Execute Playbook'}
            </button>
          </div>

          {/* Actions Table */}
          {incident.actions && incident.actions.length > 0 ? (
            <table className="actions-table">
              <thead>
                <tr><th>Action Type</th><th>Performed By</th><th>Successful?</th></tr>
              </thead>
              <tbody>
                {incident.actions.map(act => (
                  <tr key={act.action_id}>
                    <td>{act.action_type}</td>
                    <td>{act.performed_by_name || 'System'}</td>
                    <td style={{ color: act.was_successful ? 'var(--resolved)' : 'var(--high)' }}>
                      {act.was_successful ? 'Yes' : 'No'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No actions taken yet. Run a playbook above to generate actions.</p>
          )}
        </div>
      )}

      {/* TAB: EVIDENCE (Placeholder if not implemented yet) */}
      {activeTab === 'evidence' && (
        <div className="tab-content">
          <div className="upload-area">
            <input type="file" onChange={e => setSelectedFile(e.target.files[0])} />
            <button onClick={handleUpload}>Upload</button>
          </div>
          <ul className="evidence-list">
            {incident.evidence_list?.map(ev => (
              <li key={ev.evidence_id}>
                <a href={`${mediaBase}${ev.file_path}`} target="_blank" rel="noopener noreferrer">{ev.file_path}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* TAB: ASSETS */}
      {activeTab === 'assets' && (
        <div className="tab-content">
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: 'var(--bg-elevated)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <select value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)} style={{ padding: '10px', borderRadius: '8px', flex: 1, background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
              <option value="">Select an asset to link...</option>
              {allAssets.map(a => <option key={a.app_id} value={a.app_id}>{a.app_name} ({a.ip_address})</option>)}
            </select>
            <button onClick={handleLinkAsset} className="btn-primary" disabled={!selectedAsset}>Link Asset</button>
          </div>

          {assets.length > 0 ? (
            <ul className="assets-list">
              {assets.map(a => (
                <li key={a.incident_asset_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--border)' }}>
                  <span><strong>{a.app_name}</strong> - {a.impact_type}</span>
                  <button onClick={() => handleUnlinkAsset(a.incident_asset_id)} style={{ background: 'var(--critical)', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Remove</button>
                </li>
              ))}
            </ul>
          ) : <p style={{ color: 'var(--text-muted)' }}>No assets linked yet.</p>}
        </div>
      )}

      {/* TAB: IOCs */}
      {activeTab === 'iocs' && (
        <div className="tab-content">
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: 'var(--bg-elevated)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <select value={selectedIoc} onChange={e => setSelectedIoc(e.target.value)} style={{ padding: '10px', borderRadius: '8px', flex: 1, background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
              <option value="">Select an IOC to link...</option>
              {allIocs.map(i => <option key={i.ioc_id} value={i.ioc_id}>{i.ioc_type}: {i.ioc_value}</option>)}
            </select>
            <select value={selectedMatchedApp} onChange={e => setSelectedMatchedApp(e.target.value)} style={{ padding: '10px', borderRadius: '8px', flex: 1, background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
              <option value="">Matched Asset (Optional)</option>
              {allAssets.map(a => <option key={a.app_id} value={a.app_id}>{a.app_name}</option>)}
            </select>
            <button onClick={handleLinkIoc} className="btn-primary" disabled={!selectedIoc}>Link IOC</button>
          </div>

          {incidentIocs.length > 0 ? (
            <ul className="assets-list">
              {incidentIocs.map(i => (
                <li key={i.incident_ioc_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--border)' }}>
                  <span><strong>{i.ioc_type}</strong>: {i.ioc_value}</span>
                  <button onClick={() => handleUnlinkIoc(i.incident_ioc_id)} style={{ background: 'var(--critical)', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Remove</button>
                </li>
              ))}
            </ul>
          ) : <p style={{ color: 'var(--text-muted)' }}>No IOCs linked yet.</p>}
        </div>
      )}

      {/* TAB: METRICS */}
      {activeTab === 'metrics' && (
        <div className="tab-content">
          {/* Add Metric Form */}
          <div style={{
            background: 'var(--bg-elevated)', padding: '16px', borderRadius: '12px',
            marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center',
            flexWrap: 'wrap', border: '1px solid var(--border)'
          }}>
            <h4 style={{ color: 'var(--accent-primary)', margin: 0, flexBasis: '100%' }}>⏱️ Log Performance Metric</h4>

            <select
              value={metricType}
              onChange={e => setMetricType(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', flex: 1, minWidth: '180px', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <option value="Time to Detect">Time to Detect</option>
              <option value="Time to Contain">Time to Contain</option>
              <option value="Time to Eradicate">Time to Eradicate</option>
              <option value="Time to Recover">Time to Recover</option>
            </select>

            <input
              type="number"
              min="0"
              step="any"
              placeholder="Value (in minutes)"
              value={metricValue}
              onChange={e => setMetricValue(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', flex: 1, minWidth: '150px', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            />

            <button
              onClick={handleAddMetric}
              disabled={!metricValue}
              className="btn-primary"
              style={{ padding: '10px 20px', opacity: !metricValue ? 0.5 : 1 }}
            >
              Save Metric
            </button>
          </div>

          {/* Metrics Table */}
          {metricsLog.length > 0 ? (
            <table className="actions-table">
              <thead>
                <tr><th>Metric Type</th><th>Value</th><th>Recorded At</th></tr>
              </thead>
              <tbody>
                {metricsLog.map(metric => (
                  <tr key={metric.metric_id}>
                    <td><strong>{metric.metric_type}</strong></td>
                    <td style={{ color: 'var(--accent-primary)' }}>{metric.value_numeric} minutes</td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(metric.measured_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No metrics logged for this incident yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default IncidentDetail;
