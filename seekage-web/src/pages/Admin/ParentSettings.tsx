import React, { useState } from 'react';
import { useAuth } from '../../utils/AuthContext';

export default function ParentSettings() {
  const { user, parentPasswords, setParentPassword } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  if (user?.role !== 'admin') {
    return <div className="empty">Admins only.</div>;
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned) { alert('Enter a student phone number'); return; }
    if (!password) { alert('Enter a password'); return; }
    setParentPassword(cleaned, password);
    setPhone('');
    setPassword('');
    alert('Saved.');
  }

  return (
    <>
      <header className="page-header">
        <div>
          <div className="greeting">Admin</div>
          <h1>Parent Passwords</h1>
        </div>
      </header>

      <div style={{ padding: 20 }}>
        <p style={{ color: '#555', fontSize: 13, marginTop: 0 }}>
          Assign or update the parent password for a student, keyed by the student's phone number.
          Parents use it to hide/unhide content via the "0" button on each item.
          Parents can change it later; admins can reset it here at any time.
        </p>

        <form onSubmit={save}>
          <label className="label">Student phone number</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 9999999999" inputMode="tel" />

          <label className="label">Parent password</label>
          <input className="input" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="e.g. 1234" />

          <button className="btn" type="submit" style={{ marginTop: 24 }}>Save</button>
        </form>

        <h3 style={{ marginTop: 28, color: 'var(--navy)' }}>Currently assigned</h3>
        {Object.keys(parentPasswords).length === 0 && <div className="empty">None yet.</div>}
        <ul style={{ paddingLeft: 18, color: '#333', fontSize: 13 }}>
          {Object.entries(parentPasswords).map(([ph, pw]) => (
            <li key={ph}>
              <code>{ph}</code> — <code>{pw}</code>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
