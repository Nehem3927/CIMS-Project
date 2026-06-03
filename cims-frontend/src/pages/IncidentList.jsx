import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getIncidents, getIncidentStatus, getPriorities, getCategories } from '../services/api';
import { FiPlus, FiEye, FiSearch, FiDownload, FiAlertTriangle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Skeleton from '../components/Skeleton';
import './IncidentList.css';

function IncidentList() {
  const [incidents, setIncidents] = useState([]);
  
  // Filter lookups
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [categories, setCategories] = useState([]);

  // States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Load lookups
  useEffect(() => {
    getIncidentStatus().then(res => setStatuses(res.data.results || res.data)).catch(console.error);
    getPriorities().then(res => setPriorities(res.data.results || res.data)).catch(console.error);
    getCategories().then(res => setCategories(res.data.results || res.data)).catch(console.error);
  }, []);

  // Debounce search effect (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, priorityFilter, categoryFilter]);

  const loadIncidents = () => {
    setIsLoading(true);
    const params = {
      page,
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      category: categoryFilter || undefined,
    };
    getIncidents(params)
      .then(res => {
        if (res.data.results) {
          setIncidents(res.data.results);
          setTotalPages(Math.ceil(res.data.count / 10) || 1);
        } else {
          setIncidents(res.data);
          setTotalPages(1);
        }
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to load incidents.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadIncidents();
  }, [page, debouncedSearch, statusFilter, priorityFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadIncidents();
  };

  const handleExportCSV = async () => {
    const exportToast = toast.loading('Generating CSV export...');
    try {
      const token = localStorage.getItem('access');
      const params = new URLSearchParams({
        search: search || '',
        status: statusFilter || '',
        priority: priorityFilter || '',
        category: categoryFilter || '',
      });
      const response = await fetch(`http://localhost:8000/api/incidents/export/?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Export request failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incidents_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported successfully!', { id: exportToast });
    } catch (error) {
      console.error('Failed to export CSV', error);
      toast.error('Error exporting CSV', { id: exportToast });
    }
  };

  const getStatusClass = (status) => {
    const map = {
      'New': 'status-new',
      'Investigating': 'status-investigating',
      'Contained': 'status-contained',
      'Eradicated': 'status-eradicated',
      'Recovered': 'status-recovered',
      'Closed': 'status-closed',
    };
    return map[status] || '';
  };

  const getPriorityClass = (priority) => {
    if (!priority) return 'priority-default';
    const p = priority.toLowerCase();
    if (p.includes('critical')) return 'priority-critical';
    if (p.includes('high'))     return 'priority-high';
    if (p.includes('medium'))   return 'priority-medium';
    if (p.includes('low'))      return 'priority-low';
    return 'priority-default';
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setPage(1);
  };

  return (
    <div className="incident-list-container">
      <div className="list-header">
        <div>
          <h1>Incidents</h1>
          <p className="list-header-sub">Track and manage all active security incidents</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary" id="export-csv-btn" onClick={handleExportCSV}>
            <FiDownload /> Export CSV
          </button>
          <Link to="/incidents/new" className="btn-primary" id="new-incident-btn">
            <FiPlus /> New Incident
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <form onSubmit={handleSearchSubmit}>
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search by title, description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {isLoading && search !== debouncedSearch ? (
              <div className="search-spinner" aria-label="Searching…"></div>
            ) : (
              <button type="submit" className="search-btn" aria-label="Search">
                <FiSearch />
              </button>
            )}
          </div>
        </form>

        <div className="filters-select-group">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            {statuses.map(st => (
              <option key={st.status_id} value={st.status_id}>
                {st.status_name}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={priorityFilter}
            onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Priorities</option>
            {priorities.map(pr => (
              <option key={pr.priority_id} value={pr.priority_id}>
                {pr.priority_level}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.category_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="incident-table-wrapper">
        <table className="incident-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>ID</th>
              <th>Title</th>
              <th style={{ width: '150px' }}>Status</th>
              <th style={{ width: '130px' }}>Priority</th>
              <th style={{ width: '180px' }}>Category</th>
              <th style={{ width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading Skeleton State
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  <td><Skeleton height="20px" width="40px" /></td>
                  <td><Skeleton height="20px" width="80%" /></td>
                  <td><Skeleton height="24px" width="90px" borderRadius="12px" /></td>
                  <td><Skeleton height="24px" width="70px" borderRadius="12px" /></td>
                  <td><Skeleton height="20px" width="100px" /></td>
                  <td><Skeleton height="32px" width="70px" borderRadius="6px" /></td>
                </tr>
              ))
            ) : incidents.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <FiAlertTriangle className="empty-icon" />
                    <h3>No Incidents Found</h3>
                    <p>We couldn't find any incidents matching your search criteria or selected filters.</p>
                    <div className="empty-actions">
                      <button className="btn-secondary" onClick={clearFilters}>
                        Reset Filters
                      </button>
                      <Link to="/incidents/new" className="btn-primary">
                        Log First Incident
                      </Link>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              incidents.map(inc => (
                <tr key={inc.incident_id}>
                  <td className="incident-id-cell">#{inc.incident_id}</td>
                  <td className="incident-title-cell">{inc.title}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(inc.status_name)}`}>
                      {inc.status_name}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-badge ${getPriorityClass(inc.priority_level)}`}>
                      {inc.priority_level || 'N/A'}
                    </span>
                  </td>
                  <td>{inc.category_name}</td>
                  <td>
                    <Link to={`/incidents/${inc.incident_id}`} className="btn-view">
                      <FiEye /> View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {!isLoading && totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={page === 1}
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="pagination-btn"
            disabled={page === totalPages}
            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default IncidentList;