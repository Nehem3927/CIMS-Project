import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api/',
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('access');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// ── Authentication ───────────────────────────────────────
export const login = (username, password) => API.post('/token/', { username, password });
export const getCurrentUser = () => API.get('/me/');
export const changePassword = (data) => API.post('/me/', data);

// ── Incidents ────────────────────────────────────────────
export const getIncidents = (params) => API.get('/incidents/', { params });
export const getIncident = (id) => API.get(`/incidents/${id}/`);
export const createIncident = (data) => API.post('/incidents/', data);
export const updateIncident = (id, data) => API.put(`/incidents/${id}/`, data);
export const addIncidentUpdate = (id, message) =>
  API.post(`/incidents/${id}/add_update/`, { update_message: message });
export const uploadEvidence = (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post(`/incidents/${id}/upload_evidence/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ── Lookups ───────────────────────────────────────────────
export const getIncidentStatus = () => API.get('/incident-status/');
export const getPriorities = () => API.get('/priorities/');
export const getCategories = () => API.get('/categories/');
export const getRoles = () => API.get('/roles/');

// ── Assets ───────────────────────────────────────────────
export const getAssets = () => API.get('/assets/');
export const createAsset = (data) => API.post('/assets/', data);
export const deleteAsset = (id) => API.delete(`/assets/${id}/`);
export const linkAsset = (data) => API.post('/incident-assets/', data);
export const unlinkAsset = (id) => API.delete(`/incident-assets/${id}/`);

// ── IOCs ──────────────────────────────────────────────────
export const getIocs = () => API.get('/iocs/');
export const createIoc = (data) => API.post('/iocs/', data);
export const deleteIoc = (id) => API.delete(`/iocs/${id}/`);
export const linkIoc = (data) => API.post('/incident-iocs/', data);
export const unlinkIoc = (id) => API.delete(`/incident-iocs/${id}/`);

// ── Threat Feeds ──────────────────────────────────────────
export const getThreatFeeds = () => API.get('/threat-feeds/');
export const createThreatFeed = (data) => API.post('/threat-feeds/', data);
export const deleteThreatFeed = (id) => API.delete(`/threat-feeds/${id}/`);

// ── Playbooks ─────────────────────────────────────────────
export const getPlaybooks = () => API.get('/playbooks/');
export const createPlaybook = (data) => API.post('/playbooks/', data);
export const deletePlaybook = (id) => API.delete(`/playbooks/${id}/`);
export const getPlaybookSteps = (playbookId) =>
  API.get('/playbook-steps/', { params: { playbook: playbookId } });
export const createPlaybookStep = (data) => API.post('/playbook-steps/', data);
export const deletePlaybookStep = (id) => API.delete(`/playbook-steps/${id}/`);

// ── Teams ─────────────────────────────────────────────────
export const getTeams = () => API.get('/teams/');
export const createTeam = (data) => API.post('/teams/', data);
export const updateTeam = (id, data) => API.put(`/teams/${id}/`, data);
export const deleteTeam = (id) => API.delete(`/teams/${id}/`);

// ── Categories ────────────────────────────────────────────
export const createCategory = (data) => API.post('/categories/', data);
export const updateCategory = (id, data) => API.put(`/categories/${id}/`, data);
export const deleteCategory = (id) => API.delete(`/categories/${id}/`);

// ── Response Actions ──────────────────────────────────────
export const getResponseActions = (params) => API.get('/response-actions/', { params });
export const createResponseAction = (data) => API.post('/response-actions/', data);
export const deleteResponseAction = (id) => API.delete(`/response-actions/${id}/`);

// ── Metrics Log ───────────────────────────────────────────
export const getMetricsLog = (incidentId) =>
  API.get('/metrics-log/', { params: { incident: incidentId } });
export const createMetric = (data) => API.post('/metrics-log/', data);
export const deleteMetric = (id) => API.delete(`/metrics-log/${id}/`);

// ── Audit Logs ────────────────────────────────────────────
export const getAuditLogs = (params) => API.get('/audit-logs/', { params });

// ── User Management ───────────────────────────────────────
export const getUsers = () => API.get('/users/');
export const createUser = (data) => API.post('/users/', data);
export const updateUser = (id, data) => API.put(`/users/${id}/`, data);
export const deleteUser = (id) => API.delete(`/users/${id}/`);

// ── Dashboard ─────────────────────────────────────────────
export const getDashboardKPI = () => API.get('/dashboard/kpi/');
export const getDashboardTrend = () => API.get('/dashboard/trend/');

export default API;