import axios from 'axios';

export const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

export interface RegisterPayload {
  name: string;
  phone: string;
  password: string;
  age?: string;
  state?: string;
  schoolCode?: string;
  registrationType: 'seekage' | 'school';
}

export const loginUser = (phone: string, password: string, role: string) =>
  api.post('/auth/login', { phone, password, role });

export const registerUser = (data: RegisterPayload) => api.post('/auth/register', data);

export const fetchContent = (groupId: number) => api.get(`/content/${groupId}`);

export const uploadContent = (formData: FormData, token: string) =>
  api.post('/content/upload', formData, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
  });

export const toggleHide = (contentId: number, hidden: boolean, token: string) =>
  api.patch(
    `/content/${contentId}/hide`,
    { hidden },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const fetchGroups = (token: string) =>
  api.get('/groups', { headers: { Authorization: `Bearer ${token}` } });

export const fetchSchoolGroups = (schoolId: number, token: string) =>
  api.get(`/groups/school/${schoolId}`, { headers: { Authorization: `Bearer ${token}` } });

export const fetchQA = (groupId: number) => api.get(`/qa/${groupId}`);

export const postQuestion = (groupId: number, question: string, token: string) =>
  api.post('/qa', { groupId, question }, { headers: { Authorization: `Bearer ${token}` } });

export const postAnswer = (qaId: number, answer: string, token: string) =>
  api.post(`/qa/${qaId}/answer`, { answer }, { headers: { Authorization: `Bearer ${token}` } });

export const fetchMessages = (groupId: number) => api.get(`/chat/${groupId}`);

export const verifyParentPassword = (userId: number, password: string) =>
  api.post('/auth/verify-parent-password', { userId, password });
