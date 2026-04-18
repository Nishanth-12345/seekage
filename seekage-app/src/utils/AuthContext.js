import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // null = logged out
  const [lang, setLang]       = useState('en');   // 'en' | 'ml'

  const login  = (userData) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, lang, setLang, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// ─── Translation strings ───────────────────────────────────────────────────
export const T = {
  en: {
    appName:       'SEEKAGE',
    login:         'Login',
    register:      'Register',
    phone:         'Phone Number',
    password:      'Password',
    parentPassword:'Parent Password',
    name:          'Full Name',
    age:           'Age',
    state:         'State',
    schoolCode:    'School Code',
    role:          'Select Role',
    seekagePath:   'SEEKAGE Path',
    schoolPath:    'School Path',
    batches:       'My Batches',
    subjects:      'My Subjects',
    upload:        'Upload',
    videos:        'Videos',
    documents:     'Documents',
    qa:            'Q & A',
    chat:          'Chat',
    hide:          'Hide from student',
    unhide:        'Show to student',
    send:          'Send',
    typeMessage:   'Type a message…',
    typeQuestion:  'Ask a question…',
    answer:        'Answer',
    counseling:    'Counseling',
    logout:        'Logout',
    students:      'Students',
    groups:        'Groups',
  },
  ml: {
    appName:       'സീക്കേജ്',
    login:         'ലോഗിൻ',
    register:      'രജിസ്റ്റർ',
    phone:         'ഫോൺ നമ്പർ',
    password:      'പാസ്‌വേഡ്',
    parentPassword:'രക്ഷകർത്താവ് പാസ്‌വേഡ്',
    name:          'പൂർണ്ണ പേര്',
    age:           'പ്രായം',
    state:         'സംസ്ഥാനം',
    schoolCode:    'സ്കൂൾ കോഡ്',
    role:          'റോൾ തിരഞ്ഞെടുക്കുക',
    seekagePath:   'സീക്കേജ് പാത',
    schoolPath:    'സ്കൂൾ പാത',
    batches:       'എന്റെ ബാച്ചുകൾ',
    subjects:      'എന്റെ വിഷയങ്ങൾ',
    upload:        'അപ്‌ലോഡ്',
    videos:        'വീഡിയോകൾ',
    documents:     'രേഖകൾ',
    qa:            'ചോ & ഉ',
    chat:          'ചാറ്റ്',
    hide:          'മറയ്ക്കുക',
    unhide:        'കാണിക്കുക',
    send:          'അയക്കുക',
    typeMessage:   'സന്ദേശം ടൈപ്പ് ചെയ്യുക…',
    typeQuestion:  'ചോദ്യം ചോദിക്കുക…',
    answer:        'ഉത്തരം',
    counseling:    'കൗൺസിലിംഗ്',
    logout:        'ലോഗ്ഔട്ട്',
    students:      'വിദ്യാർത്ഥികൾ',
    groups:        'ഗ്രൂപ്പുകൾ',
  },
};
