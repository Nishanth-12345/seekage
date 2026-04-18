import axios from 'axios';

// ── Change BASE_URL to your deployed Node.js server address ──────────────────
export const BASE_URL = 'http://YOUR_SERVER_IP:5000/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

// ─── Auth ────────────────────────────────────────────────────────────────────
export const loginUser      = (phone, password, role) =>
  api.post('/auth/login', { phone, password, role });

export const registerUser   = (data) =>
  api.post('/auth/register', data);

// ─── Content ─────────────────────────────────────────────────────────────────
export const fetchContent    = (groupId) =>
  api.get(`/content/${groupId}`);

export const uploadContent   = (formData, token) =>
  api.post('/content/upload', formData, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
  });

export const toggleHide = (contentId, hidden, token) =>
  api.patch(`/content/${contentId}/hide`, { hidden }, {
    headers: { Authorization: `Bearer ${token}` },
  });

// ─── Groups ──────────────────────────────────────────────────────────────────
export const fetchGroups     = (token) =>
  api.get('/groups', { headers: { Authorization: `Bearer ${token}` } });

export const fetchSchoolGroups = (schoolId, token) =>
  api.get(`/groups/school/${schoolId}`, { headers: { Authorization: `Bearer ${token}` } });

// ─── Q&A ─────────────────────────────────────────────────────────────────────
export const fetchQA         = (groupId) =>
  api.get(`/qa/${groupId}`);

export const postQuestion    = (groupId, question, token) =>
  api.post('/qa', { groupId, question }, { headers: { Authorization: `Bearer ${token}` } });

export const postAnswer      = (qaId, answer, token) =>
  api.post(`/qa/${qaId}/answer`, { answer }, { headers: { Authorization: `Bearer ${token}` } });

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const fetchMessages   = (groupId) =>
  api.get(`/chat/${groupId}`);

// ─── Parent Hide (password-protected) ───────────────────────────────────────
export const verifyParentPassword = (userId, password) =>
  api.post('/auth/verify-parent-password', { userId, password });
