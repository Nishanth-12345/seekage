import React, { useState } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { createParentPassword } from '../../utils/api';

export default function ParentSettings() {
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<{ phone: string; studentName: string } | null>(null);

  if (user?.role !== 'admin') {
    return <div className="empty">Admins only.</div>;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned) { alert('Enter a student phone number'); return; }
    if (!password) { alert('Enter a password'); return; }
    if (!user?.token) { alert('Please login again'); return; }

    setSaving(true);
    try {
      const response = await createParentPassword({ student_phone: cleaned, password }, user.token);
      setLastSaved({ phone: cleaned, studentName: response.data.studentName });
      setPhone('');
      setPassword('');
      alert(response.data.message || 'Saved.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save parent password');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <div className="greeting">Admin</div>
          <h1>Parent Passwords</h1>
        </div>
      </header>

      <div className="admin-form">
        <div className="form-intro">
          <h2>Password Control</h2>
          <p>
          Assign or update the parent password for a student by phone number. The password is stored on the backend.
          </p>
        </div>

        <form onSubmit={save}>
          <label className="label">Student phone number</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 9999999999" inputMode="tel" />

          <label className="label">Parent password</label>
          <input className="input" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="e.g. parent123" />

          <button className="btn" type="submit" style={{ marginTop: 24 }} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>

        {lastSaved && (
          <div className="info-box" style={{ marginTop: 24 }}>
            Saved for <b>{lastSaved.studentName}</b> (<code>{lastSaved.phone}</code>).
          </div>
        )}
      </div>
    </>
  );
}
