import axios from 'axios';

export const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

export interface RegisterPayload {
  name: string;
  phone: string;
  password: string;
  age?: string;
  state?: string;
  schoolCode?: string;
  role?: 'student' | 'teacher';
  registrationType: 'seekage' | 'school';
}

export const loginUser = (phone: string, password: string, role: string) =>
  api.post('/auth/login', { phone, password, role });

export const registerUser = (data: RegisterPayload) => api.post('/auth/register', data);

export const fetchCurrentUser = (token: string) =>
  api.get('/auth/me', { headers: authHeaders(token) });

export const verifyParentPassword = (data: { studentId?: number; studentPhone?: string; phone?: string; password: string }) =>
  api.post('/auth/verify-parent-password', data);

export const fetchGroups = (token: string) =>
  api.get('/groups', { headers: authHeaders(token) });

export const fetchSchoolGroups = (schoolId: number, token: string) =>
  api.get(`/groups/school/${schoolId}`, { headers: authHeaders(token) });

export interface CreateSchoolPayload {
  school_name?: string;
  registration_type?: 'school';
  school_code: string;
  name?: string;
  place: string;
}

export const createSchool = (data: CreateSchoolPayload, token: string) =>
  api.post('/groups/school', data, { headers: authHeaders(token) });

export interface CreateParentPasswordPayload {
  student_phone: string;
  password: string;
}

export const createParentPassword = (data: CreateParentPasswordPayload, token: string) =>
  api.post('/groups/parent-password', data, { headers: authHeaders(token) });

export interface CreateGroupPayload {
  group_name: string;
  group_type?: 'age_based' | 'school_based';
  school_id?: number | null;
}

export const createGroup = (data: CreateGroupPayload, token: string) =>
  api.post('/groups', data, { headers: authHeaders(token) });

export const fetchContent = (groupId: number, token?: string) =>
  api.get(`/groups/content/${groupId}`, token ? { headers: authHeaders(token) } : undefined);

export const fetchSubjectsByGroup = (groupId: number, token: string) =>
  api.get(`/groups/${groupId}/subjects`, { headers: authHeaders(token) });

export const deleteContentById = (contentId: number, token: string) =>
  api.delete(`/groups/content/${contentId}`, { headers: authHeaders(token) });

export interface HideContentByParentPayload {
  content_id: number;
  group_id: number;
  subject_id: number;
  password: string;
}

export const hideContentByParent = (data: HideContentByParentPayload, token: string) =>
  api.patch('/groups/content/parent-hide', data, { headers: authHeaders(token) });

export interface CreateSubjectPayload {
  group_id: number;
  school_id?: number;
  subject_name: string;
}

export const createSeekageSubject = (data: CreateSubjectPayload, token: string) =>
  api.post('/groups/content/seekage', data, { headers: authHeaders(token) });

export const createSchoolSubject = (data: Required<CreateSubjectPayload>, token: string) =>
  api.post('/groups/content/school', data, { headers: authHeaders(token) });

export interface UploadContentPayload {
  group_id: number;
  subject_id: number;
  subject_name?: string;
  content_type: 'video' | 'document' | 'note' | 'assignment';
  title: string;
  file_url?: string;
}

export const uploadContent = (data: UploadContentPayload | FormData, token: string) =>
  api.post('/groups/content', data, {
    headers: authHeaders(token),
    timeout: 10 * 60 * 1000,
  });

export const fetchQuestionsByContent = (contentId: number, subjectId: number, token: string) =>
  api.get(`/groups/questions/content/${contentId}/subject/${subjectId}`, {
    headers: authHeaders(token),
  });

export interface CreateQuestionPayload {
  content_id: number;
  group_id: number;
  subject_id: number;
  question: string;
}

export const createQuestion = (data: CreateQuestionPayload, token: string) =>
  api.post('/groups/questions', data, { headers: authHeaders(token) });

export const postAnswer = (qaId: number, answer: string, token: string) =>
  api.post(`/qa/${qaId}/answer`, { answer }, { headers: authHeaders(token) });

export const fetchMessages = (groupId: number) => api.get(`/chat/${groupId}`);
