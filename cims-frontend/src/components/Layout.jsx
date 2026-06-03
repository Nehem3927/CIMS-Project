import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  FiHome, FiAlertCircle, FiHardDrive, FiBook, FiShield,
  FiLogOut, FiBell, FiUser, FiSun, FiMoon, FiRss, FiClock,
  FiUsers, FiLayers, FiZap, FiTag, FiLock, FiMenu, FiX,
} from 'react-icons/fi';
import { getCurrentUser, changePassword } from '../services/api';
import './Layout.css';

function Layout() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('cims-theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Change Password Modal States
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  const handlePwdChange = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!pwdForm.old_password || !pwdForm.new_password || !pwdForm.confirm_password) {
      setPwdError('All fields are required.');
      return;
    }

    if (pwdForm.new_password !== pwdForm.confirm_password) {
      setPwdError('New passwords do not match.');
      return;
    }

    if (pwdForm.new_password.length < 6) {
      setPwdError('New password must be at least 6 characters long.');
      return;
    }

    setPwdSubmitting(true);
    try {
      await changePassword({
        old_password: pwdForm.old_password,
        new_password: pwdForm.new_password,
      });
      setPwdSuccess('Password updated successfully!');
      setPwdForm({ old_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => {
        setShowPwdModal(false);
        setPwdSuccess('');
      }, 1500);
    } catch (err) {
      setPwdError(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setPwdSubmitting(false);
    }
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('cims-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('cims-theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    getCurrentUser()
      .then(res => {
        setCurrentUser(res.data);
        localStorage.setItem('cims-role', res.data.role);
        localStorage.setItem('cims-is-staff', res.data.is_staff);
      })
      .catch(err => console.error('Error fetching current user:', err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('cims-role');
    localStorage.removeItem('cims-is-staff');
    navigate('/login');
  };

  const isAdmin = currentUser?.is_staff;

  // ── Sidebar structure ─────────────────────────────────
  const navGroups = [
    {
      label: 'Overview',
      items: [
        { to: '/',          icon: <FiHome />,        label: 'Dashboard',   end: true },
        { to: '/incidents', icon: <FiAlertCircle />, label: 'Incidents' },
      ],
    },
    {
      label: 'Intelligence',
      items: [
        { to: '/iocs',          icon: <FiShield />, label: 'IOCs' },
        { to: '/threat-feeds',  icon: <FiRss />,    label: 'Threat Feeds' },
      ],
    },
    {
      label: 'Response',
      items: [
        { to: '/playbooks',        icon: <FiBook />,    label: 'Playbooks' },
        { to: '/response-actions', icon: <FiZap />,     label: 'Response Actions' },
        { to: '/assets',           icon: <FiHardDrive />, label: 'Assets' },
      ],
    },
    {
      label: 'Administration',
      adminOnly: true,
      items: [
        { to: '/teams',      icon: <FiUsers />,  label: 'Teams',      adminOnly: true },
        { to: '/categories', icon: <FiLayers />, label: 'Categories', adminOnly: true },
        { to: '/users',      icon: <FiTag />,    label: 'Users',      adminOnly: true },
        { to: '/audit-logs', icon: <FiClock />,  label: 'Audit Logs', adminOnly: true },
      ],
    },
  ];

  return (
    <div className="app-container">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <FiShield className="brand-icon" />
          </div>
          <div>
            <div className="sidebar-title">CIMS</div>
            <div className="sidebar-subtitle">Incident Management</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navGroups.map(group => {
            if (group.adminOnly && !isAdmin) return null;
            const visibleItems = group.items.filter(item => !item.adminOnly || isAdmin);
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.label} className="nav-group">
                <div className="nav-group-label">{group.label}</div>
                {visibleItems.map(({ to, icon, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
                  >
                    <span className="nav-icon">{icon}</span>
                    <span className="nav-label">{label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="change-pwd-btn" onClick={() => setShowPwdModal(true)}>
            <FiLock />
            <span>Change Password</span>
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button 
            className="hamburger-btn" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
          <div className="topbar-search">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input type="search" id="global-search" placeholder="Search incidents, assets, playbooks…" />
          </div>

          <div className="topbar-actions">
            <button
              id="theme-toggle-btn"
              className={`theme-toggle ${isDark ? 'theme-toggle--dark' : 'theme-toggle--light'}`}
              onClick={() => setIsDark(prev => !prev)}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              <span className="theme-toggle-track">
                <span className="theme-toggle-thumb">
                  {isDark ? <FiMoon size={12} /> : <FiSun size={12} />}
                </span>
              </span>
              <span className="theme-toggle-label">{isDark ? 'Dark' : 'Light'}</span>
            </button>

            <button className="icon-btn" id="notifications-btn" aria-label="Notifications">
              <FiBell />
            </button>
            <button className="profile-chip" id="profile-btn" onClick={handleLogout} aria-label="User menu">
              <FiUser />
              <span>{currentUser?.username || 'User'} ({currentUser?.role || 'Guest'})</span>
            </button>
          </div>
        </header>

        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>

      {/* ── Change Password Modal ── */}
      {showPwdModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Change Password</h3>
              <button className="close-btn" onClick={() => setShowPwdModal(false)}>×</button>
            </div>
            
            <form onSubmit={handlePwdChange}>
              {pwdError && <div className="pwd-error">{pwdError}</div>}
              {pwdSuccess && <div className="pwd-success">{pwdSuccess}</div>}

              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  required
                  value={pwdForm.old_password}
                  onChange={e => setPwdForm({ ...pwdForm, old_password: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  required
                  value={pwdForm.new_password}
                  onChange={e => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={pwdForm.confirm_password}
                  onChange={e => setPwdForm({ ...pwdForm, confirm_password: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowPwdModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={pwdSubmitting}>
                  {pwdSubmitting ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Layout;