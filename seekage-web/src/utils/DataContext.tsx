import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { deleteFile } from './fileStorage';

const STORAGE_PREFIX = 'seekage:v1:';

function loadPersisted<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
}

function usePersistedState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => loadPersisted(key, initial));
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(state));
    } catch {
      // storage full or disabled — keep working in-memory
    }
  }, [key, state]);
  return [state, setState] as const;
}

export type ContentKind = 'video' | 'note' | 'document' | 'assignment';

export interface Group {
  groupId: string;          // e.g. 'seekage-A' or 'school-GHS2024-8A'
  portal: 'seekage' | 'school';
  name: string;
  schoolCode?: string;      // only for school groups
  teacher?: string;
}

export interface Subject {
  subjectId: string;
  groupId: string;
  name: string;
  createdBy: string;        // user name
}

export interface ContentItem {
  contentId: number;
  subjectId: string;
  kind: ContentKind;
  title: string;
  fileName: string;
  hiddenByParent: boolean;
  uploadedBy: string;
}

export interface MeetingLink {
  meetingId: number;
  subjectId: string;        // or group-level if empty
  groupId: string;
  title: string;
  url: string;
  description: string;
  scheduledAt?: string;
  createdBy: string;
  createdAt: number;        // ts
}

export interface QAEntry {
  id: number;
  subjectId: string;
  question: string;
  askedBy: string;
  answers: Array<{ text: string; by: string }>;
}

export interface ChatMsg {
  id: number;
  subjectId: string;
  text: string;
  senderId: number;
  senderName: string;
  time: string;
}

interface DataContextValue {
  groups: Group[];
  addGroup: (g: Group) => void;
  subjects: Subject[];
  addSubject: (s: Subject) => void;
  content: ContentItem[];
  addContent: (c: ContentItem) => void;
  toggleHide: (contentId: number) => void;
  deleteContent: (contentId: number) => void;
  meetings: MeetingLink[];
  addMeeting: (m: MeetingLink) => void;
  readMeetings: number[];           // ids already seen by current user (for notification badge)
  markMeetingRead: (id: number) => void;
  qa: QAEntry[];
  addQuestion: (subjectId: string, question: string, by: string) => void;
  addAnswer: (qaId: number, text: string, by: string) => void;
  chat: ChatMsg[];
  addChat: (m: ChatMsg) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

const SEED_GROUPS: Group[] = [
  { groupId: 'seekage-A', portal: 'seekage', name: 'Group A · Ages 8–10' },
  { groupId: 'seekage-B', portal: 'seekage', name: 'Group B · Ages 11–13' },
  { groupId: 'seekage-C', portal: 'seekage', name: 'Group C · Ages 14–16' },
  { groupId: 'school-GHS2024-8A', portal: 'school', schoolCode: 'GHS2024', name: 'Class 8A', teacher: 'Mrs. Priya' },
  { groupId: 'school-GHS2024-9B', portal: 'school', schoolCode: 'GHS2024', name: 'Class 9B', teacher: 'Mr. Suresh' },
];

const SEED_SUBJECTS: Subject[] = [
  { subjectId: 'subj-1', groupId: 'seekage-B', name: 'Mathematics', createdBy: 'Admin' },
  { subjectId: 'subj-2', groupId: 'seekage-B', name: 'Science', createdBy: 'Admin' },
  { subjectId: 'subj-3', groupId: 'school-GHS2024-8A', name: 'English', createdBy: 'Mrs. Priya' },
];

const SEED_CONTENT: ContentItem[] = [
  { contentId: 1, subjectId: 'subj-1', kind: 'video', title: 'Chapter 1 · Numbers', fileName: 'numbers.mp4', hiddenByParent: false, uploadedBy: 'Admin' },
  { contentId: 2, subjectId: 'subj-1', kind: 'note', title: 'Algebra Notes', fileName: 'algebra.pdf', hiddenByParent: false, uploadedBy: 'Admin' },
  { contentId: 3, subjectId: 'subj-2', kind: 'video', title: 'Photosynthesis', fileName: 'photosynthesis.mp4', hiddenByParent: true, uploadedBy: 'Admin' },
];

const SEED_MEETINGS: MeetingLink[] = [
  {
    meetingId: 1, subjectId: 'subj-1', groupId: 'seekage-B',
    title: 'Live doubt class – Algebra',
    url: 'https://meet.google.com/abc-defg-hij',
    description: 'Bring your assignment doubts.',
    scheduledAt: 'Tomorrow 6 PM',
    createdBy: 'Admin', createdAt: Date.now() - 1000 * 60 * 30,
  },
];

const SEED_QA: QAEntry[] = [
  { id: 1, subjectId: 'subj-1', question: 'How to solve linear equations?', askedBy: 'Arjun',
    answers: [{ text: 'Isolate x on one side.', by: 'Teacher' }] },
];

const SEED_CHAT: ChatMsg[] = [
  { id: 1, subjectId: 'subj-1', text: 'Good morning everyone!', senderId: 99, senderName: 'Teacher', time: '09:01' },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = usePersistedState<Group[]>('groups', SEED_GROUPS);
  const [subjects, setSubjects] = usePersistedState<Subject[]>('subjects', SEED_SUBJECTS);
  const [content, setContent] = usePersistedState<ContentItem[]>('content', SEED_CONTENT);
  const [meetings, setMeetings] = usePersistedState<MeetingLink[]>('meetings', SEED_MEETINGS);
  const [readMeetings, setReadMeetings] = usePersistedState<number[]>('readMeetings', []);
  const [qa, setQa] = usePersistedState<QAEntry[]>('qa', SEED_QA);
  const [chat, setChat] = usePersistedState<ChatMsg[]>('chat', SEED_CHAT);

  const value: DataContextValue = {
    groups,
    addGroup: (g) => setGroups((prev) => [...prev, g]),
    subjects,
    addSubject: (s) => setSubjects((prev) => [...prev, s]),
    content,
    addContent: (c) => setContent((prev) => [...prev, c]),
    toggleHide: (id) =>
      setContent((prev) => prev.map((c) => (c.contentId === id ? { ...c, hiddenByParent: !c.hiddenByParent } : c))),
    deleteContent: (id) => {
      setContent((prev) => prev.filter((c) => c.contentId !== id));
      deleteFile(id).catch(() => { /* best-effort cleanup */ });
    },
    meetings,
    addMeeting: (m) => setMeetings((prev) => [m, ...prev]),
    readMeetings,
    markMeetingRead: (id) =>
      setReadMeetings((prev) => (prev.includes(id) ? prev : [...prev, id])),
    qa,
    addQuestion: (subjectId, question, by) =>
      setQa((prev) => [{ id: Date.now(), subjectId, question, askedBy: by, answers: [] }, ...prev]),
    addAnswer: (qaId, text, by) =>
      setQa((prev) => prev.map((q) => (q.id === qaId ? { ...q, answers: [...q.answers, { text, by }] } : q))),
    chat,
    addChat: (m) => setChat((prev) => [...prev, m]),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
};
