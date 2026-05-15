import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchCurrentUser } from './api';

const TOKEN_KEY = 'seekage:token';

export type Portal = 'seekage' | 'school';
export type Role = 'admin' | 'student' | 'parent' | 'teacher' | 'counselor' | 'psychologist';

export interface User {
  id: number;
  name: string;
  portal: Portal;
  role: Role;
  phone: string;
  age?: number;
  ageGroup?: 'A' | 'B' | 'C';
  schoolCode?: string;
  schoolId?: number;
  groupId?: number;
  token: string;
}

export type Lang = 'en' | 'ml';

interface AuthContextValue {
  user: User | null;
  lang: Lang;
  setLang: (l: Lang) => void;
  login: (u: User) => void;
  logout: () => void;
  loadingUser: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function ageGroupOf(age: number): 'A' | 'B' | 'C' | null {
  if (age >= 8 && age <= 10) return 'A';
  if (age >= 11 && age <= 13) return 'B';
  if (age >= 14 && age <= 16) return 'C';
  return null;
}

export const AGE_GROUPS: Array<{ id: 'A' | 'B' | 'C'; label: string; range: string }> = [
  { id: 'A', label: 'Group A', range: '8 - 10 years' },
  { id: 'B', label: 'Group B', range: '11 - 13 years' },
  { id: 'C', label: 'Group C', range: '14 - 16 years' },
];

function portalFor(user: { role: string; schoolId?: number | null }) {
  return user.schoolId ? 'school' : 'seekage';
}

function toUser(apiUser: any, token: string): User {
  const age = apiUser.age ? Number(apiUser.age) : undefined;
  return {
    id: apiUser.id,
    name: apiUser.name,
    portal: portalFor(apiUser),
    role: apiUser.role,
    phone: apiUser.phone,
    age,
    ageGroup: age ? ageGroupOf(age) || undefined : undefined,
    schoolCode: apiUser.schoolCode || undefined,
    schoolId: apiUser.schoolId || undefined,
    groupId: apiUser.groupId || undefined,
    token,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Lang>('en');
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoadingUser(false);
      return;
    }

    fetchCurrentUser(token)
      .then((response) => setUser(toUser(response.data.user, token)))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoadingUser(false));
  }, []);

  const login = (u: User) => {
    localStorage.setItem(TOKEN_KEY, u.token);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, lang, setLang, login, logout, loadingUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export const T: Record<Lang, Record<string, string>> = {
  en: {
    appName: 'SEEKAGE',
    login: 'Login',
    register: 'Register',
    phone: 'Phone Number',
    password: 'Password',
    parentPassword: 'Parent Password',
    name: 'Full Name',
    age: 'Age',
    state: 'State',
    schoolCode: 'School Code',
    role: 'Select Role',
    seekagePath: 'SEEKAGE',
    schoolPath: 'School',
    batches: 'My Batches',
    subjects: 'Subjects',
    upload: 'Upload',
    videos: 'Videos',
    documents: 'Documents',
    notes: 'Notes',
    qa: 'Q & A',
    chat: 'Chat',
    meetings: 'Meetings',
    hide: 'Hide from student',
    unhide: 'Show to student',
    send: 'Send',
    typeMessage: 'Type a message...',
    typeQuestion: 'Ask a question...',
    answer: 'Answer',
    counseling: 'Counseling',
    logout: 'Logout',
    students: 'Students',
    groups: 'Groups',
    teacher: 'Teacher',
    student: 'Student',
    admin: 'Admin',
    chooseLogin: 'Choose how to sign in',
    addSubject: 'Add subject',
    newMeeting: 'New meeting link',
  },
  ml: {
    appName: 'സീക്കേജ്',
    login: 'ലോഗിൻ',
    register: 'രജിസ്റ്റർ',
    phone: 'ഫോൺ നമ്പർ',
    password: 'പാസ്‌വേഡ്',
    parentPassword: 'രക്ഷകർത്താവ് പാസ്‌വേഡ്',
    name: 'പൂർണ്ണ പേര്',
    age: 'പ്രായം',
    state: 'സംസ്ഥാനം',
    schoolCode: 'സ്കൂൾ കോഡ്',
    role: 'റോൾ തിരഞ്ഞെടുക്കുക',
    seekagePath: 'സീക്കേജ്',
    schoolPath: 'സ്കൂൾ',
    batches: 'എന്റെ ബാച്ചുകൾ',
    subjects: 'വിഷയങ്ങൾ',
    upload: 'അപ്‌ലോഡ്',
    videos: 'വീഡിയോകൾ',
    documents: 'രേഖകൾ',
    notes: 'നോട്ട്സ്',
    qa: 'ചോ & ഉ',
    chat: 'ചാറ്റ്',
    meetings: 'മീറ്റിംഗുകൾ',
    hide: 'മറയ്ക്കുക',
    unhide: 'കാണിക്കുക',
    send: 'അയയ്ക്കുക',
    typeMessage: 'സന്ദേശം ടൈപ്പ് ചെയ്യുക...',
    typeQuestion: 'ചോദ്യം ചോദിക്കുക...',
    answer: 'ഉത്തരം',
    counseling: 'കൗൺസിലിംഗ്',
    logout: 'ലോഗൗട്ട്',
    students: 'വിദ്യാർത്ഥികൾ',
    groups: 'ഗ്രൂപ്പുകൾ',
    teacher: 'അധ്യാപകൻ',
    student: 'വിദ്യാർത്ഥി',
    admin: 'അഡ്മിൻ',
    chooseLogin: 'ലോഗിൻ രീതി തിരഞ്ഞെടുക്കുക',
    addSubject: 'വിഷയം ചേർക്കുക',
    newMeeting: 'പുതിയ മീറ്റിംഗ്',
  },
};
