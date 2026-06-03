import { useEffect, useState } from 'react';
import { getCategories, getPriorities, createCategory, updateCategory, deleteCategory } from '../services/api';
import { FiLayers, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import './Categories.css';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [formData, setFormData] = useState({
    category_name: '',
    parent_category: '',
    default_priority: '',
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
      const [catRes, priRes] = await Promise.all([getCategories(), getPriorities()]);
      setCategories(catRes.data.results || catRes.data);
      setPriorities(priRes.data.results || priRes.data);
    } catch (err) {
      console.error('Failed to load categories', err);
      toast.error('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setTargetId(null);
    setFormData({ category_name: '', parent_category: '', default_priority: '' });
    setShowModal(true);
  };

  const openEditModal = (cat) => {
    setEditMode(true);
    setTargetId(cat.category_id);
    setFormData({
      category_name: cat.category_name,
      parent_category: cat.parent_category || '',
      default_priority: cat.default_priority || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.category_name.trim()) return;
    try {
      const payload = {
        category_name: formData.category_name,
        parent_category: formData.parent_category || null,
        default_priority: formData.default_priority || null,
      };
      if (editMode) {
        await updateCategory(targetId, payload);
        toast.success('Category updated successfully!');
      } else {
        await createCategory(payload);
        toast.success('Category created successfully!');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to save category', err);
      toast.error('Error saving category. Check if name already exists.');
    }
  };

  const handleDelete = (cat) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Category',
      message: `Are you sure you want to delete category "${cat.category_name}"? This may affect linked incidents.`,
      onConfirm: async () => {
        try {
          await deleteCategory(cat.category_id);
          loadData();
          toast.success('Category deleted successfully!');
        } catch (err) {
          console.error('Failed to delete category', err);
          toast.error('Cannot delete this category — it may be in use by one or more incidents.');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const getPriorityColor = (name) => {
    if (!name) return 'priority-none';
    const n = name.toLowerCase();
    if (n.includes('critical')) return 'priority-critical';
    if (n.includes('high')) return 'priority-high';
    if (n.includes('medium')) return 'priority-medium';
    if (n.includes('low')) return 'priority-low';
    return 'priority-none';
  };

  if (loading) return <div className="loading">Loading categories…</div>;

  return (
    <div className="categories-container">
      <div className="categories-header">
        <div>
          <h1>Incident Categories</h1>
          <p className="categories-subtitle">Manage the category hierarchy and default priorities</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <FiPlus /> New Category
        </button>
      </div>

      <div className="categories-table-wrapper">
        <table className="categories-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Category Name</th>
              <th>Parent Category</th>
              <th>Default Priority</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <FiLayers />
                    <p>No categories found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              categories.map(cat => (
                <tr key={cat.category_id}>
                  <td className="id-cell">#{cat.category_id}</td>
                  <td className="name-cell">
                    <div className="category-name-row">
                      <FiLayers className="cat-icon" />
                      <span>{cat.category_name}</span>
                    </div>
                  </td>
                  <td className="parent-cell">
                    {cat.parent_name ? (
                      <span className="parent-badge">
                        <FiChevronRight style={{ verticalAlign: 'middle', marginRight: 3 }} />
                        {cat.parent_name}
                      </span>
                    ) : (
                      <span className="root-badge">Root</span>
                    )}
                  </td>
                  <td>
                    {cat.default_priority_name ? (
                      <span className={`priority-pill ${getPriorityColor(cat.default_priority_name)}`}>
                        {cat.default_priority_name}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn-edit" onClick={() => openEditModal(cat)}>
                        <FiEdit2 /> Edit
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(cat)}>
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
              <h3>{editMode ? 'Edit Category' : 'New Category'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label htmlFor="cat-name">Category Name *</label>
                <input
                  id="cat-name"
                  type="text"
                  placeholder="e.g. Phishing, Ransomware, Data Breach"
                  value={formData.category_name}
                  onChange={e => setFormData({ ...formData, category_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="cat-parent">Parent Category</label>
                <select
                  id="cat-parent"
                  value={formData.parent_category}
                  onChange={e => setFormData({ ...formData, parent_category: e.target.value || null })}
                >
                  <option value="">— None (Root) —</option>
                  {categories
                    .filter(c => !editMode || c.category_id !== targetId)
                    .map(c => (
                      <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="cat-priority">Default Priority</label>
                <select
                  id="cat-priority"
                  value={formData.default_priority}
                  onChange={e => setFormData({ ...formData, default_priority: e.target.value || null })}
                >
                  <option value="">— No Default —</option>
                  {priorities.map(p => (
                    <option key={p.priority_id} value={p.priority_id}>{p.priority_level}</option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  <FiCheck style={{ marginRight: 6 }} /> Save Category
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

export default Categories;
