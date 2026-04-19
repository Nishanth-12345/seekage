import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');

  const ADMIN_CODE = 'SEEKAGE-ADMIN';

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || !password) { alert('Fill phone + password'); return; }
    if (adminCode !== ADMIN_CODE) {
      alert('Invalid admin access code. This page is for Seekage admins only.');
      return;
    }
    login({
      id: Date.now(),
      name: 'Seekage Admin',
      portal: 'seekage',
      role: 'admin',
      phone,
      token: 'dev-token',
    });
  }

  return (
    <div className="auth-page">
      <button type="button" className="back-link" onClick={() => navigate('/login')}>← Back to user login</button>

      <div className="logo-wrap">
        <div className="logo-circle">SK</div>
        <div className="app-name">SEEKAGE</div>
        <div className="tagline">Admin Portal</div>
      </div>

      <h2 style={{ color: 'var(--navy)', margin: '0 0 16px' }}>Seekage Admin Login</h2>
      <div className="note" style={{ marginBottom: 12 }}>
        Restricted area. Only Seekage administrators can sign in here. Students and school users must use the standard login page.
      </div>

      <form onSubmit={submit}>
        <label className="label">Phone</label>
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />

        <label className="label">Password</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <label className="label">Admin Access Code</label>
        <input
          className="input"
          type="password"
          value={adminCode}
          onChange={(e) => setAdminCode(e.target.value)}
          placeholder="Provided to admins only"
        />

        <button className="btn" type="submit" style={{ marginTop: 24 }}>Sign in as Admin</button>
      </form>
    </div>
  );
}
