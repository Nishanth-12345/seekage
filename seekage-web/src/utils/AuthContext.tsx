import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const PARENT_PW_KEY = 'seekage:v1:parentPasswords';

function loadParentPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PARENT_PW_KEY);
    if (!raw) return { '9999999999': '1234' };
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return { '9999999999': '1234' };
  }
}

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
  token: string;
}

export type Lang = 'en' | 'ml';

interface AuthContextValue {
  user: User | null;
  lang: Lang;
  setLang: (l: Lang) => void;
  login: (u: User) => void;
  logout: () => void;
  parentPasswords: Record<string, string>;   // keyed by student phone number
  setParentPassword: (phone: string, pwd: string) => void;
  verifyParentPassword: (phone: string, pwd: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function ageGroupOf(age: number): 'A' | 'B' | 'C' | null {
  if (age >= 8 && age <= 10) return 'A';
  if (age >= 11 && age <= 13) return 'B';
  if (age >= 14 && age <= 16) return 'C';
  return null;
}

export const AGE_GROUPS: Array<{ id: 'A' | 'B' | 'C'; label: string; range: string }> = [
  { id: 'A', label: 'Group A', range: '8 – 10 years' },
  { id: 'B', label: 'Group B', range: '11 – 13 years' },
  { id: 'C', label: 'Group C', range: '14 – 16 years' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Lang>('en');
  const [parentPasswords, setParentPasswords] = useState<Record<string, string>>(() => loadParentPasswords());

  useEffect(() => {
    try {
      localStorage.setItem(PARENT_PW_KEY, JSON.stringify(parentPasswords));
    } catch {
      // storage full or disabled — keep working in-memory
    }
  }, [parentPasswords]);

  const login = (u: User) => setUser(u);
  const logout = () => setUser(null);

  const normalizePhone = (phone: string) => phone.replace(/\D/g, '');

  const setParentPassword = (phone: string, pwd: string) =>
    setParentPasswords((prev) => ({ ...prev, [normalizePhone(phone)]: pwd }));

  const verifyParentPassword = (phone: string, pwd: string) =>
    parentPasswords[normalizePhone(phone)] === pwd;

  return (
    <AuthContext.Provider
      value={{ user, lang, setLang, login, logout, parentPasswords, setParentPassword, verifyParentPassword }}
    >
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
    typeMessage: 'Type a message…',
    typeQuestion: 'Ask a question…',
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
    send: 'അയക്കുക',
    typeMessage: 'സന്ദേശം ടൈപ്പ് ചെയ്യുക…',
    typeQuestion: 'ചോദ്യം ചോദിക്കുക…',
    answer: 'ഉത്തരം',
    counseling: 'കൗൺസിലിംഗ്',
    logout: 'ലോഗ്ഔട്ട്',
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
