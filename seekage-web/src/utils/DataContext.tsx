import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ContentKind = 'video' | 'note' | 'document' | 'assignment';

export interface Group {
  groupId: string;
  portal: 'seekage' | 'school';
  name: string;
  schoolCode?: string;
  schoolId?: number | null;
  teacher?: string;
  subjectCount?: number;
}

export interface Subject {
  subjectId: string;
  groupId: string;
  name: string;
  createdBy: string;
}

export interface ContentItem {
  contentId: number;
  subjectId: string;
  kind: ContentKind;
  title: string;
  fileName: string;
  fileUrl?: string;
  hiddenByParent: boolean;
  uploadedBy: string;
}

export interface MeetingLink {
  meetingId: number;
  subjectId: string;
  groupId: string;
  title: string;
  url: string;
  description: string;
  scheduledAt?: string;
  createdBy: string;
  createdAt: number;
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
  setGroupsData: (groups: Group[]) => void;
  addGroup: (group: Group) => void;
  subjects: Subject[];
  setSubjectsData: (subjects: Subject[]) => void;
  addSubject: (subject: Subject) => void;
  content: ContentItem[];
  setContentData: (content: ContentItem[]) => void;
  addContent: (content: ContentItem) => void;
  toggleHide: (contentId: number) => void;
  deleteContent: (contentId: number) => void;
  meetings: MeetingLink[];
  addMeeting: (meeting: MeetingLink) => void;
  readMeetings: number[];
  markMeetingRead: (id: number) => void;
  qa: QAEntry[];
  addQuestion: (subjectId: string, question: string, by: string) => void;
  addAnswer: (qaId: number, text: string, by: string) => void;
  chat: ChatMsg[];
  addChat: (message: ChatMsg) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [meetings, setMeetings] = useState<MeetingLink[]>([]);
  const [readMeetings, setReadMeetings] = useState<number[]>([]);
  const [qa, setQa] = useState<QAEntry[]>([]);
  const [chat, setChat] = useState<ChatMsg[]>([]);

  const value: DataContextValue = {
    groups,
    setGroupsData: setGroups,
    addGroup: (group) =>
      setGroups((prev) => (prev.some((item) => item.groupId === group.groupId) ? prev : [...prev, group])),
    subjects,
    setSubjectsData: setSubjects,
    addSubject: (subject) =>
      setSubjects((prev) => (prev.some((item) => item.subjectId === subject.subjectId) ? prev : [...prev, subject])),
    content,
    setContentData: setContent,
    addContent: (item) =>
      setContent((prev) => (prev.some((existing) => existing.contentId === item.contentId) ? prev : [...prev, item])),
    toggleHide: (id) =>
      setContent((prev) => prev.map((item) => (
        item.contentId === id ? { ...item, hiddenByParent: !item.hiddenByParent } : item
      ))),
    deleteContent: (id) => setContent((prev) => prev.filter((item) => item.contentId !== id)),
    meetings,
    addMeeting: (meeting) => setMeetings((prev) => [meeting, ...prev]),
    readMeetings,
    markMeetingRead: (id) =>
      setReadMeetings((prev) => (prev.includes(id) ? prev : [...prev, id])),
    qa,
    addQuestion: (subjectId, question, by) =>
      setQa((prev) => [{ id: Date.now(), subjectId, question, askedBy: by, answers: [] }, ...prev]),
    addAnswer: (qaId, text, by) =>
      setQa((prev) => prev.map((item) => (
        item.id === qaId ? { ...item, answers: [...item.answers, { text, by }] } : item
      ))),
    chat,
    addChat: (message) => setChat((prev) => [...prev, message]),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
};
