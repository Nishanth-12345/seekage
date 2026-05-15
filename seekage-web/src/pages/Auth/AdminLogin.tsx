import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { loginUser } from '../../utils/api';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [loading, setLoading] = useState(false);

  const ADMIN_CODE = 'SEEKAGE-ADMIN';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || !password) { alert('Fill phone + password'); return; }
    if (adminCode !== ADMIN_CODE) {
      alert('Invalid admin access code. This page is for Seekage admins only.');
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser(phone, password, 'admin');
      const apiUser = response.data.user;
      login({
        id: apiUser.id,
        name: apiUser.name,
        portal: 'seekage',
        role: 'admin',
        phone: apiUser.phone,
        schoolId: apiUser.schoolId,
        token: response.data.token,
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
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

        <button className="btn" type="submit" style={{ marginTop: 24 }} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in as Admin'}
        </button>
      </form>
    </div>
  );
}
