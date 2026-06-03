import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIncident } from '../services/api';
import { toast } from 'react-hot-toast';
import './CreateIncident.css';

function CreateIncident() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    priority_id: '',
    assigned_to: '',
  });
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access');
        const headers = { Authorization: `Bearer ${token}` };
        const [catRes, priRes, userRes] = await Promise.all([
          fetch('http://localhost:8000/api/categories/', { headers }).then(r => r.json()),
          fetch('http://localhost:8000/api/priorities/', { headers }).then(r => r.json()),
          fetch('http://localhost:8000/api/users/', { headers }).then(r => r.json()),
        ]);
        setCategories(catRes.results || catRes);
        setPriorities(priRes.results || priRes);
        setUsers(userRes.results || userRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createIncident(form);
      toast.success('Incident logged successfully!');
      navigate('/incidents');
    } catch (err) {
      toast.error('Failed to create incident. Please check all required fields.');
    }
  };

  if (loading) return <div className="loading">Loading form data…</div>;

  return (
    <div className="create-incident-container">
      <h1>Create New Incident</h1>
      <p className="create-incident-subtitle">Fill in the details below to log a new security incident.</p>

      <div className="incident-form-card">
        <form onSubmit={handleSubmit} className="incident-form">
          <div className="form-field">
            <label htmlFor="inc-title">Title <span className="required-star">*</span></label>
            <input
              id="inc-title"
              name="title"
              placeholder="Brief title describing the incident"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="inc-description">Description</label>
            <textarea
              id="inc-description"
              name="description"
              placeholder="Detailed description of what happened, how it was detected, and initial scope…"
              value={form.description}
              onChange={handleChange}
              rows="4"
            />
          </div>

          <div className="form-divider" />

          <div className="form-field">
            <label htmlFor="inc-category">Category <span className="required-star">*</span></label>
            <select id="inc-category" name="category_id" value={form.category_id} onChange={handleChange} required>
              <option value="">Select a category</option>
              {categories.map(c => (
                <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="inc-priority">Priority</label>
            <select id="inc-priority" name="priority_id" value={form.priority_id} onChange={handleChange}>
              <option value="">None</option>
              {priorities.map(p => (
                <option key={p.priority_id} value={p.priority_id}>{p.priority_level}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="inc-assigned">Assign To</label>
            <select id="inc-assigned" name="assigned_to" value={form.assigned_to} onChange={handleChange}>
              <option value="">Unassigned</option>
              {users.map(u => (
                <option key={u.user_id} value={u.user_id}>{u.username}</option>
              ))}
            </select>
          </div>

          <div className="form-buttons">
            <button type="submit" id="create-incident-submit" className="btn-submit">Create Incident</button>
            <button type="button" onClick={() => navigate('/incidents')} className="btn-cancel">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default CreateIncident;