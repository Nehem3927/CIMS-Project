import { useEffect, useState } from 'react';
import {
  getPlaybooks,
  createPlaybook,
  deletePlaybook,
  getPlaybookSteps,
  createPlaybookStep,
  deletePlaybookStep
} from '../services/api';
import { FiBook, FiPlus, FiTrash2, FiLayers } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import './Playbooks.css';

function Playbooks() {
  const [playbooks, setPlaybooks] = useState([]);
  const [newPlaybookName, setNewPlaybookName] = useState('');
  const [selectedPlaybook, setSelectedPlaybook] = useState(null);
  const [steps, setSteps] = useState([]);
  const [newStepText, setNewStepText] = useState('');
  const [newStepNumber, setNewStepNumber] = useState('');

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    loadPlaybooks();
  }, []);

  useEffect(() => {
    if (selectedPlaybook) {
      loadSteps(selectedPlaybook.playbook_id);
    } else {
      setSteps([]);
    }
  }, [selectedPlaybook]);

  const loadPlaybooks = async () => {
    try {
      const res = await getPlaybooks();
      const list = res.data.results || res.data;
      setPlaybooks(list);
    } catch (err) {
      console.error('Error loading playbooks:', err);
      toast.error('Failed to load playbooks.');
    }
  };

  const loadSteps = async (playbookId) => {
    try {
      const res = await getPlaybookSteps(playbookId);
      const list = res.data.results || res.data;
      const sorted = [...list].sort((a, b) => a.step_number - b.step_number);
      setSteps(sorted);
    } catch (err) {
      console.error('Error loading playbook steps:', err);
      toast.error('Failed to load playbook steps.');
    }
  };

  const handleAddPlaybook = async () => {
    if (!newPlaybookName.trim()) return;
    try {
      const res = await createPlaybook({ playbook_name: newPlaybookName });
      setNewPlaybookName('');
      toast.success('Playbook created successfully!');
      await loadPlaybooks();
      
      const list = res.data.results || res.data;
      if (res.data && res.data.playbook_id) {
        setSelectedPlaybook(res.data);
      } else if (Array.isArray(list) && list.length > 0) {
        const match = list.find(p => p.playbook_name === newPlaybookName);
        if (match) setSelectedPlaybook(match);
      }
    } catch (err) {
      toast.error('Error creating playbook.');
    }
  };

  const handleDeletePlaybook = (e, id, name) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Delete Playbook',
      message: `Are you sure you want to delete the playbook "${name}" and all its sequential steps?`,
      onConfirm: async () => {
        try {
          await deletePlaybook(id);
          if (selectedPlaybook && selectedPlaybook.playbook_id === id) {
            setSelectedPlaybook(null);
          }
          loadPlaybooks();
          toast.success('Playbook deleted successfully!');
        } catch (err) {
          toast.error('Error deleting playbook.');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAddStep = async () => {
    if (!selectedPlaybook) return;
    if (!newStepText.trim()) return;

    let num = parseInt(newStepNumber, 10);
    if (isNaN(num)) {
      num = steps.length > 0 ? Math.max(...steps.map(s => s.step_number)) + 1 : 1;
    }

    try {
      await createPlaybookStep({
        playbook: selectedPlaybook.playbook_id,
        step_number: num,
        step_description: newStepText,
      });
      setNewStepText('');
      setNewStepNumber('');
      toast.success('Step added successfully!');
      loadSteps(selectedPlaybook.playbook_id);
    } catch (err) {
      toast.error('Error adding playbook step. Check if step number already exists.');
    }
  };

  const handleDeleteStep = (stepId, stepNum) => {
    if (!selectedPlaybook) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete Playbook Step',
      message: `Are you sure you want to delete step ${stepNum}?`,
      onConfirm: async () => {
        try {
          await deletePlaybookStep(stepId);
          loadSteps(selectedPlaybook.playbook_id);
          toast.success('Playbook step deleted.');
        } catch (err) {
          toast.error('Error deleting playbook step.');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="playbooks-container">
      <div className="playbooks-header">
        <h1>Playbooks</h1>
        <p className="playbooks-subtitle">Define and manage incident response playbooks and steps</p>
      </div>

      <div className="playbooks-split-layout">
        {/* Left column: Playbook listing */}
        <div className="playbooks-left-pane">
          <div className="pane-card new-playbook-card">
            <h3>Create Playbook</h3>
            <div className="new-playbook-form">
              <input
                type="text"
                placeholder="Playbook Name (e.g. Malware Outbreak)"
                value={newPlaybookName}
                onChange={e => setNewPlaybookName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddPlaybook()}
              />
              <button className="add-pb-btn" onClick={handleAddPlaybook}>
                <FiPlus /> Create
              </button>
            </div>
          </div>

          <div className="playbooks-list-wrapper">
            <h3>Playbook Registry</h3>
            {playbooks.length === 0 ? (
              <div className="empty-pane">No playbooks found.</div>
            ) : (
              <div className="playbooks-sidebar-list">
                {playbooks.map(pb => (
                  <div
                    key={pb.playbook_id}
                    className={`playbook-list-item ${selectedPlaybook?.playbook_id === pb.playbook_id ? 'active' : ''}`}
                    onClick={() => setSelectedPlaybook(pb)}
                  >
                    <div className="pb-item-info">
                      <FiBook className="pb-item-icon" />
                      <span className="pb-item-name">{pb.playbook_name}</span>
                    </div>
                    <button
                      className="pb-item-delete-btn"
                      onClick={(e) => handleDeletePlaybook(e, pb.playbook_id, pb.playbook_name)}
                      title="Delete playbook"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Playbook Steps */}
        <div className="playbooks-right-pane">
          {selectedPlaybook ? (
            <div className="pane-card steps-card">
              <div className="steps-header">
                <h2>{selectedPlaybook.playbook_name}</h2>
                <span className="steps-count-badge">{steps.length} Steps</span>
              </div>

              {/* Add step form */}
              <div className="add-step-form">
                <h4>Add Sequential Step</h4>
                <div className="step-form-row">
                  <input
                    type="number"
                    className="step-num-input"
                    placeholder="No."
                    value={newStepNumber}
                    onChange={e => setNewStepNumber(e.target.value)}
                    title="Leave blank to auto-increment"
                  />
                  <input
                    type="text"
                    className="step-text-input"
                    placeholder="Step Description (e.g. Isolate Virtual Machine)"
                    value={newStepText}
                    onChange={e => setNewStepText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddStep()}
                  />
                  <button className="add-step-btn" onClick={handleAddStep}>
                    <FiPlus style={{ marginRight: 4 }} /> Add
                  </button>
                </div>
              </div>

              {/* Steps timeline list */}
              <div className="steps-timeline-container">
                {steps.length === 0 ? (
                  <div className="empty-pane">This playbook has no steps. Use the form above to add response procedures.</div>
                ) : (
                  <div className="steps-timeline">
                    {steps.map((step) => (
                      <div key={step.step_id} className="timeline-node">
                        <div className="timeline-badge">{step.step_number}</div>
                        <div className="timeline-content">
                          <p className="step-description">{step.step_description}</p>
                          <button
                            className="step-delete-btn"
                            onClick={() => handleDeleteStep(step.step_id, step.step_number)}
                            title="Delete step"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-right-state">
              <FiLayers className="empty-icon" />
              <h3>No Playbook Selected</h3>
              <p>Select a playbook from the registry list to view, edit, or configure its sequential response steps.</p>
            </div>
          )}
        </div>
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

export default Playbooks;