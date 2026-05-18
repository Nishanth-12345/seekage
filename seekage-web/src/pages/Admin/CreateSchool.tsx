import React, { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { createSchool } from '../../utils/api';

export default function CreateSchool() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [place, setPlace] = useState('');
  const [saving, setSaving] = useState(false);

  if (user?.role !== 'admin') {
    return <div className="empty">Only admins can create schools.</div>;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();

    if (!name.trim() || !schoolCode.trim() || !place.trim()) {
      alert('School name, code, and place are required');
      return;
    }

    if (!user?.token) return;

    try {
      setSaving(true);
      await createSchool({
        name: name.trim(),
        school_code: schoolCode.trim().toUpperCase(),
        place: place.trim(),
        registration_type: 'school',
      }, user.token);

      alert('School created');
      setName('');
      setSchoolCode('');
      setPlace('');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create school');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <div className="greeting">Admin</div>
          <h1>Create School</h1>
        </div>
        <button className="logout-link" onClick={() => navigate(-1)}>Back</button>
      </header>

      <form className="admin-form" onSubmit={submit}>
        <div className="form-intro">
          <h2>School Details</h2>
          <p>Create a school profile and code that teachers and students can use during registration.</p>
        </div>

        <label className="label" htmlFor="school-name">School name</label>
        <input
          id="school-name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Government High School"
        />

        <label className="label" htmlFor="school-code">School code</label>
        <input
          id="school-code"
          className="input"
          value={schoolCode}
          onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
          placeholder="e.g. GHS2024"
        />

        <label className="label" htmlFor="school-place">Place</label>
        <input
          id="school-place"
          className="input"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="e.g. Thiruvananthapuram"
        />

        <button className="btn" type="submit" disabled={saving}>
          {saving ? 'Creating...' : 'Create School'}
        </button>
      </form>
    </>
  );
}
