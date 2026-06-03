import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-links">
        <Link to="/" className="nav-link">Dashboard</Link>
        <Link to="/incidents" className="nav-link">Incidents</Link>
        <Link to="/assets" className="nav-link">Assets</Link>
        <Link to="/playbooks" className="nav-link">Playbooks</Link>
        <Link to="/iocs" className="nav-link">IOCs</Link>
      </div>
      <div className="navbar-actions">
        <button className="nav-logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;