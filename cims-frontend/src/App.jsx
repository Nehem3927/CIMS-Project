import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import IncidentList from './pages/IncidentList';
import IncidentDetail from './pages/IncidentDetail';
import CreateIncident from './pages/CreateIncident';
import Assets from './pages/Assets';
import Playbooks from './pages/Playbooks';
import Iocs from './pages/Iocs';
import ThreatFeeds from './pages/ThreatFeeds';
import AuditLogs from './pages/AuditLogs';
import Users from './pages/Users';
import Teams from './pages/Teams';
import Categories from './pages/Categories';
import ResponseActions from './pages/ResponseActions';

function App() {
  const isLoggedIn = () => !!localStorage.getItem('access');

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'cims-toast',
          style: {
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--sans)',
            fontSize: '14px',
            borderRadius: '8px',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={isLoggedIn() ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/incidents" element={<IncidentList />} />
          <Route path="/incidents/new" element={<CreateIncident />} />
          <Route path="/incidents/:id" element={<IncidentDetail />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/playbooks" element={<Playbooks />} />
          <Route path="/iocs" element={<Iocs />} />
          <Route path="/threat-feeds" element={<ThreatFeeds />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/response-actions" element={<ResponseActions />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/users" element={<Users />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;