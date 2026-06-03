import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getIncident, addIncidentUpdate, uploadEvidence,
  getAssets, getIocs, linkAsset, linkIoc, unlinkAsset, unlinkIoc,
  createMetric, deleteMetric,
  createResponseAction, deleteResponseAction,
} from '../services/api';
import { FiArrowLeft, FiPlus, FiTrash2, FiDownload, FiEye, FiFileText } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import './IncidentDetail.css';

// ── Evidence preview helper ───────────────────────────────
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
const PDF_EXT = 'pdf';

function getExt(filePath) {
  return (filePath || '').split('.').pop().toLowerCase();
}

function EvidencePreview({ ev, onPreviewPdf }) {
  const mediaBase = 'http://localhost:8000/media/';
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
  const [activeTab, setActiveTab] = useState('updates');

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
  const [metricType, setMetricType] = useState('');
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
    loadIncident();
    loadAssets();
    loadIocs();
  }, [id]);

  const loadIncident = async () => {
    const res = await getIncident(id);
    setIncident(res.data);
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
      await linkAsset({ incident: id, app: selectedAsset, impact_type: impactType });
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
    if (!metricType.trim() || metricValue === '') return;
    try {
      await createMetric({ incident: id, metric_type: metricType, value_numeric: metricValue });
      setMetricType('');
      setMetricValue('');
      loadIncident();
      toast.success('Metric logged successfully!');
    } catch (err) {
      toast.error('Error adding metric.');
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

  if (!incident) return <div className="loading">Loading incident…</div>;

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
      <div className="tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={activeTab === tab ? 'tab-active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Updates Tab ───────────────────────────────────── */}
      {activeTab === 'updates' && (
        <div className="tab-content">
          <ul className="update-list">
            {incident.updates.map(up => (
              <li key={up.update_id}>
                <strong>{up.updated_by_name || 'System'}</strong> – {up.update_message}
                <span>({new Date(up.changed_at).toLocaleString()})</span>
              </li>
            ))}
          </ul>
          <div className="add-update">
            <input
              type="text"
              placeholder="Add a new update…"
              value={updateMsg}
              onChange={e => setUpdateMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddUpdate()}
            />
            <button onClick={handleAddUpdate}>Add Update</button>
          </div>
        </div>
      )}

      {/* ── Evidence Tab ──────────────────────────────────── */}
      {activeTab === 'evidence' && (
        <div className="tab-content">
          <div className="upload-area">
            <input
              type="file"
              id="evidence-file-input"
              onChange={e => setSelectedFile(e.target.files[0])}
            />
            <button onClick={handleUpload} disabled={uploading || !selectedFile}>
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>

          {incident.evidence_list.length === 0 ? (
            <p className="empty-list">No evidence uploaded yet.</p>
          ) : (
            <div className="evidence-grid">
              {incident.evidence_list.map(ev => (
                <EvidencePreview
                  key={ev.evidence_id}
                  ev={ev}
                  onPreviewPdf={(url, name) => {
                    setPdfPreviewUrl(url);
                    setPdfPreviewName(name);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Actions Tab ───────────────────────────────────── */}
      {activeTab === 'actions' && (
        <div className="tab-content">
          <div className="actions-form">
            <select value={actionType} onChange={e => setActionType(e.target.value)}>
              <option value="">Select Action Type…</option>
              <option value="Block IP Address">Block IP Address</option>
              <option value="Isolate Host / App">Isolate Host / App</option>
              <option value="Disable User Account">Disable User Account</option>
              <option value="Patch Application Vulnerability">Patch Application Vulnerability</option>
              <option value="Quarantine Executable">Quarantine Executable</option>
              <option value="Revoke Credentials">Revoke Credentials</option>
              <option value="Other">Other (Specify…)</option>
            </select>

            {actionType === 'Other' && (
              <input
                type="text"
                placeholder="Specify Action Type…"
                value={customActionType}
                onChange={e => setCustomActionType(e.target.value)}
              />
            )}

            <select value={actionTarget} onChange={e => setActionTarget(e.target.value)}>
              <option value="">Target Asset (Optional)</option>
              {incident.assets && incident.assets.map(asset => (
                <option key={asset.incident_asset_id} value={asset.incident_asset_id}>
                  {asset.app_name}
                </option>
              ))}
            </select>

            <select value={actionSuccess} onChange={e => setActionSuccess(e.target.value)}>
              <option value="true">Outcome: Success</option>
              <option value="false">Outcome: Failed</option>
            </select>

            <button onClick={handleAddAction}>
              <FiPlus style={{ marginRight: 4 }} /> Log Action
            </button>
          </div>

          {(!incident.actions || incident.actions.length === 0) ? (
            <p className="empty-list">No response actions recorded.</p>
          ) : (
            <table className="actions-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Target Asset</th>
                  <th>Performed By</th>
                  <th>Outcome</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {incident.actions.map(act => {
                  const targetAsset = incident.assets?.find(
                    a => a.incident_asset_id === act.target
                  );
                  return (
                    <tr key={act.action_id}>
                      <td>
                        <span className="action-type-badge">{act.action_type}</span>
                      </td>
                      <td>
                        {targetAsset ? (
                          <span className="target-asset-label">{targetAsset.app_name}</span>
                        ) : (
                          <em className="text-muted">Incident-wide</em>
                        )}
                      </td>
                      <td>{act.performed_by_name || 'System'}</td>
                      <td>
                        <span className={`success-badge ${act.was_successful ? 'success-yes' : 'success-no'}`}>
                          {act.was_successful ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteAction(act.action_id)}
                          title="Delete action log"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Assets Tab ────────────────────────────────────── */}
      {activeTab === 'assets' && (
        <div className="tab-content">
          <div className="link-asset-form">
            <select value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)}>
              <option value="">Select Asset…</option>
              {allAssets.map(asset => (
                <option key={asset.app_id} value={asset.app_id}>{asset.app_name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Impact Type (e.g., Critical, High)"
              value={impactType}
              onChange={e => setImpactType(e.target.value)}
            />
            <button onClick={handleLinkAsset}>Link Asset</button>
          </div>
          <div className="linked-list">
            {incident.assets && incident.assets.length > 0 ? (
              <ul>
                {incident.assets.map(asset => (
                  <li key={asset.incident_asset_id}>
                    <div>
                      <span className="asset-name">{asset.app_name}</span>
                      {asset.impact_type && <span className="impact-badge">{asset.impact_type}</span>}
                    </div>
                    <button className="delete-btn" onClick={() => handleUnlinkAsset(asset.incident_asset_id)}>
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-list">No linked assets yet.</p>
            )}
          </div>
        </div>
      )}

      {/* ── IOCs Tab ──────────────────────────────────────── */}
      {activeTab === 'iocs' && (
        <div className="tab-content">
          <div className="link-ioc-form">
            <select value={selectedIoc} onChange={e => setSelectedIoc(e.target.value)}>
              <option value="">Select IOC…</option>
              {allIocs.map(ioc => (
                <option key={ioc.ioc_id} value={ioc.ioc_id}>
                  {ioc.ioc_type}: {ioc.ioc_value}
                </option>
              ))}
            </select>
            <select value={selectedMatchedApp} onChange={e => setSelectedMatchedApp(e.target.value)}>
              <option value="">Matched Asset (optional)</option>
              {allAssets.map(asset => (
                <option key={asset.app_id} value={asset.app_id}>{asset.app_name}</option>
              ))}
            </select>
            <button onClick={handleLinkIoc}>Link IOC</button>
          </div>
          <div className="linked-list">
            {incident.incident_iocs && incident.incident_iocs.length > 0 ? (
              <ul>
                {incident.incident_iocs.map(link => (
                  <li key={link.incident_ioc_id}>
                    <div>
                      <span className="ioc-type">{link.ioc_type}</span>
                      <span className="ioc-value">{link.ioc_value}</span>
                      {link.matched_app_name && <span className="matched-app">{link.matched_app_name}</span>}
                    </div>
                    <button className="delete-btn" onClick={() => handleUnlinkIoc(link.incident_ioc_id)}>
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-list">No linked IOCs yet.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Metrics Tab ───────────────────────────────────── */}
      {activeTab === 'metrics' && (
        <div className="tab-content">
          <div className="metrics-form">
            <input
              type="text"
              placeholder="Metric Type (e.g., MTTD, MTTR, Impact Score)"
              value={metricType}
              onChange={e => setMetricType(e.target.value)}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Value"
              value={metricValue}
              onChange={e => setMetricValue(e.target.value)}
            />
            <button onClick={handleAddMetric}>
              <FiPlus style={{ marginRight: 4 }} /> Add Metric
            </button>
          </div>

          {(!incident.metrics_log || incident.metrics_log.length === 0) ? (
            <p className="empty-list">No metrics logged for this incident.</p>
          ) : (
            <table className="metrics-table">
              <thead>
                <tr>
                  <th>Metric Type</th>
                  <th>Value</th>
                  <th>Measured At</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {incident.metrics_log.map(m => (
                  <tr key={m.metric_id}>
                    <td>
                      <span className="metric-type-badge">{m.metric_type}</span>
                    </td>
                    <td className="metric-value-cell">{Number(m.value_numeric).toFixed(2)}</td>
                    <td className="metric-date-cell">
                      {new Date(m.measured_at).toLocaleString()}
                    </td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteMetric(m.metric_id)}
                        title="Delete metric"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* PDF Preview Modal */}
      {pdfPreviewUrl && (
        <div className="pdf-modal-overlay" onClick={() => setPdfPreviewUrl(null)}>
          <div className="pdf-modal-card" onClick={e => e.stopPropagation()}>
            <div className="pdf-modal-header">
              <h3>Preview PDF: {pdfPreviewName}</h3>
              <button className="pdf-modal-close" onClick={() => setPdfPreviewUrl(null)}>
                &times;
              </button>
            </div>
            <div className="pdf-modal-body">
              <embed src={pdfPreviewUrl} type="application/pdf" width="100%" height="100%" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IncidentDetail;