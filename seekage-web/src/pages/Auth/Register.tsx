import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, T, ageGroupOf } from '../../utils/AuthContext';
import { registerUser } from '../../utils/api';

type Path = 'seekage' | 'school';
type Who = 'student' | 'teacher';

export default function Register() {
  const { lang } = useAuth();
  const t = T[lang];
  const navigate = useNavigate();

  const [path, setPath] = useState<Path>('seekage');
  const [who, setWho] = useState<Who>('student');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [state, setState] = useState('Kerala');
  const [schoolCode, setSchoolCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !phone || !password) { alert('Fill required fields'); return; }

    if (who === 'student' && !ageGroupOf(Number(age))) {
      alert('Age must be between 8 and 16 for student registration');
      return;
    }

    if (path === 'school' && !schoolCode) { alert('Enter school code'); return; }
    if (path === 'seekage' && who !== 'student') {
      alert('Seekage registration supports students only. Admin users are pre-provisioned.');
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        name,
        phone,
        password,
        age,
        state,
        schoolCode: path === 'school' ? schoolCode : undefined,
        registrationType: path,
        role: who,
      });
      alert('Account created. Please login.');
      navigate('/login');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <button type="button" className="back-link" onClick={() => navigate(-1)}>Back</button>
      <h2 style={{ color: 'var(--navy)', margin: '0 0 20px' }}>{t.register}</h2>

      <div className="path-row" style={{ marginBottom: 10 }}>
        {(['seekage', 'school'] as Path[]).map((p) => (
          <button type="button" key={p}
            className={`path-btn ${path === p ? 'active' : ''}`}
            onClick={() => setPath(p)}>
            {p === 'seekage' ? t.seekagePath : t.schoolPath}
          </button>
        ))}
      </div>

      {path === 'school' && (
        <div className="role-row" style={{ marginBottom: 8 }}>
          {(['student', 'teacher'] as Who[]).map((w) => (
            <button type="button" key={w}
              className={`role-btn ${who === w ? 'active' : ''}`}
              onClick={() => setWho(w)}>
              {w === 'teacher' ? t.teacher : t.student}
            </button>
          ))}
        </div>
      )}

      <div className="note">
        {path === 'seekage'
          ? 'Seekage students sign up with age. Admin users are pre-provisioned.'
          : "School users need the school code. Teachers upload content; students see only their class."}
      </div>

      <form onSubmit={handleRegister}>
        <label className="label">{t.name} *</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />

        <label className="label">{t.phone} *</label>
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 XXXXX XXXXX" inputMode="tel" />

        <label className="label">{t.password} *</label>
        <input className="input" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)} placeholder="Create password" />

        {path === 'school' && (
          <>
            <label className="label">{t.schoolCode} *</label>
            <input className="input" value={schoolCode} onChange={(e) => setSchoolCode(e.target.value)}
              placeholder="e.g. GHS2024" />
          </>
        )}

        {who === 'student' && (
          <>
            <label className="label">{t.age} *</label>
            <input className="input" value={age} onChange={(e) => setAge(e.target.value)}
              placeholder="Your age (8-16)" inputMode="numeric" />
            {age && !ageGroupOf(Number(age)) && (
              <div style={{ color: '#E65100', fontSize: 12, marginTop: 4 }}>Age must be between 8 and 16.</div>
            )}
            {age && ageGroupOf(Number(age)) && (
              <div className="info-box" style={{ marginTop: 8 }}>
                You will join <b>Group {ageGroupOf(Number(age))}</b>.
              </div>
            )}
          </>
        )}

        <label className="label">{t.state}</label>
        <input className="input" value={state} onChange={(e) => setState(e.target.value)} />

        <button className="btn" type="submit" style={{ marginTop: 24 }} disabled={loading}>
          {loading ? 'Registering...' : t.register}
        </button>
      </form>
    </div>
  );
}
