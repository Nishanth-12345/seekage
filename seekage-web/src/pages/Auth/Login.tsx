import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, T, Portal, Role, ageGroupOf } from '../../utils/AuthContext';

type Flow = 'pick' | 'seekage-student' | 'school-teacher' | 'school-student';

export default function Login() {
  const { login, lang, setLang } = useAuth();
  const t = T[lang];
  const navigate = useNavigate();
  const [flow, setFlow] = useState<Flow>('pick');

  if (flow === 'pick') return <PortalPicker t={t} lang={lang} setLang={setLang} setFlow={setFlow} navigate={navigate} />;

  const goBack = () => setFlow('pick');
  if (flow === 'seekage-student') return <SubForm title="Seekage Student Login" portal="seekage" role="student" onBack={goBack} onSubmit={login} navigate={navigate} askAge />;
  if (flow === 'school-teacher')  return <SubForm title="School Teacher Login"  portal="school"  role="teacher" onBack={goBack} onSubmit={login} navigate={navigate} askSchool />;
  return <SubForm title="School Student Login" portal="school" role="student" onBack={goBack} onSubmit={login} navigate={navigate} askSchool />;
}

function PortalPicker({ t, lang, setLang, setFlow, navigate }: any) {
  return (
    <div className="auth-page">
      <div className="lang-row">
        <button type="button" className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
        <button type="button" className={`lang-btn ${lang === 'ml' ? 'active' : ''}`} onClick={() => setLang('ml')}>മലയാളം</button>
      </div>
      <div className="logo-wrap">
        <div className="logo-circle">SK</div>
        <div className="app-name">{t.appName}</div>
        <div className="tagline">Learn · Grow · Succeed</div>
      </div>
      <p style={{ color: '#555', fontSize: 13, marginBottom: 12 }}>{t.chooseLogin}</p>

      <div style={{ display: 'grid', gap: 12 }}>
        <button className="portal-tile" onClick={() => setFlow('seekage-student')}>
          <span className="portal-icon">📚</span>
          <div><div className="portal-title">Seekage · Student</div><div className="portal-sub">Sign in by age — A / B / C groups</div></div>
        </button>
        <button className="portal-tile green" onClick={() => setFlow('school-teacher')}>
          <span className="portal-icon">🧑‍🏫</span>
          <div><div className="portal-title">School · Teacher</div><div className="portal-sub">Upload content for your class, chat with students</div></div>
        </button>
        <button className="portal-tile green" onClick={() => setFlow('school-student')}>
          <span className="portal-icon">🏫</span>
          <div><div className="portal-title">School · Student</div><div className="portal-sub">Join your school with the school code</div></div>
        </button>
      </div>

      <button className="link" onClick={() => navigate('/register')}>No account? {t.register}</button>
    </div>
  );
}

function SubForm({
  title, portal, role, onBack, onSubmit, navigate, askAge, askSchool,
}: {
  title: string;
  portal: Portal;
  role: Role;
  onBack: () => void;
  onSubmit: (u: any) => void;
  navigate: any;
  askAge?: boolean;
  askSchool?: boolean;
}) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [schoolCode, setSchoolCode] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || !password) { alert('Fill phone + password'); return; }
    if (askAge && !age) { alert('Enter your age'); return; }
    if (askSchool && !schoolCode) { alert('Enter school code'); return; }
    const ageNum = age ? Number(age) : undefined;
    const group = ageNum ? ageGroupOf(ageNum) : null;
    onSubmit({
      id: Date.now(),
      name: role === 'admin' ? 'Seekage Admin' : role === 'teacher' ? 'Teacher' : 'Student',
      portal, role, phone,
      age: ageNum,
      ageGroup: group || undefined,
      schoolCode: schoolCode || undefined,
      token: 'dev-token',
    });
  }

  return (
    <div className="auth-page">
      <button className="back-link" onClick={onBack}>← Back</button>
      <h2 style={{ color: portal === 'school' ? 'var(--green)' : 'var(--navy)', margin: '0 0 16px' }}>{title}</h2>

      <form onSubmit={submit}>
        <label className="label">Phone</label>
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />

        <label className="label">Password</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        {askAge && (
          <>
            <label className="label">Age (8–16)</label>
            <input className="input" value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" />
          </>
        )}
        {askSchool && (
          <>
            <label className="label">School Code</label>
            <input className="input" value={schoolCode} onChange={(e) => setSchoolCode(e.target.value)} placeholder="e.g. GHS2024" />
          </>
        )}

        <button className={`btn ${portal === 'school' ? 'btn-green' : ''}`} type="submit" style={{ marginTop: 24 }}>
          Sign in
        </button>
        <button type="button" className="link" onClick={() => navigate('/register')}>No account? Register</button>
      </form>
    </div>
  );
}
