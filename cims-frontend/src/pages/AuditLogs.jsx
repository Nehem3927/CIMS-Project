import { useEffect, useState } from 'react';
import { getAuditLogs } from '../services/api';
import { FiClock, FiSearch } from 'react-icons/fi';
import './AuditLogs.css';

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [entityFilter, setEntityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadLogs = () => {
    const params = {
      page,
      entity_name: entityFilter || undefined,
    };
    getAuditLogs(params)
      .then(res => {
        if (res.data.results) {
          setLogs(res.data.results);
          // Backend pagination is 20 per page for audit logs
          setTotalPages(Math.ceil(res.data.count / 20) || 1);
        } else {
          setLogs(res.data);
          setTotalPages(1);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadLogs();
  }, [page, entityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setEntityFilter(searchQuery);
    setPage(1);
  };

  return (
    <div className="audit-logs-container">
      <div className="audit-header">
        <div>
          <h1>Audit Logs</h1>
          <p className="audit-subtitle">Track operations and model mutations across CIMS</p>
        </div>
      </div>

      <div className="audit-filters">
        <form onSubmit={handleSearchSubmit}>
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Filter by entity name (e.g. Incident, App)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-btn" aria-label="Filter">
              <FiSearch />
            </button>
          </div>
        </form>
      </div>

      <div className="audit-table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Entity ID</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <FiClock />
                    <p>No audit logs found matching the filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.log_id}>
                  <td className="timestamp-cell">
                    {new Date(log.action_time).toLocaleString()}
                  </td>
                  <td className="user-cell">@{log.username || 'System'}</td>
                  <td>
                    <span className={`action-badge action-${log.action_type?.toLowerCase() || 'default'}`}>
                      {log.action_type}
                    </span>
                  </td>
                  <td className="entity-cell">{log.entity_name}</td>
                  <td className="id-cell">{log.entity_id || 'N/A'}</td>
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

export default AuditLogs;
