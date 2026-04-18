import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth, T } from '../../utils/AuthContext';
import { useData } from '../../utils/DataContext';

export default function MeetingsPage() {
  const { groupId = '', subjectId = '' } = useParams();
  const decoded = decodeURIComponent(groupId);
  const { user, lang } = useAuth();
  const { groups, meetings, addMeeting, readMeetings, markMeetingRead } = useData();
  const t = T[lang];
  const navigate = useNavigate();

  const group = groups.find((g) => g.groupId === decoded);
  const isSchool = group?.portal === 'school';
  const theme = isSchool ? 'green' : '';
  const canCreate = user && (user.role === 'admin' || (isSchool && user.role === 'teacher'));

  const list = meetings.filter(
    (m) => m.groupId === decoded && (subjectId === 'none' || m.subjectId === subjectId)
  );

  // Mark all visible meetings as read once the page is viewed
  useEffect(() => {
    list.forEach((m) => {
      if (!readMeetings.includes(m.meetingId)) markMeetingRead(m.meetingId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decoded, subjectId]);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  function post() {
    if (!title.trim() || !url.trim()) { alert('Title + URL required'); return; }
    if (!/^https?:\/\//i.test(url.trim())) { alert('URL must start with http(s)://'); return; }
    addMeeting({
      meetingId: Date.now(),
      groupId: decoded,
      subjectId: subjectId === 'none' ? '' : subjectId,
      title: title.trim(),
      url: url.trim(),
      description: description.trim(),
      scheduledAt: scheduledAt.trim() || undefined,
      createdBy: user?.name || 'User',
      createdAt: Date.now(),
    });
    setTitle(''); setUrl(''); setDescription(''); setScheduledAt('');
    setShowForm(false);
  }

  if (!group) return <div className="empty">Group not found.</div>;

  return (
    <>
      <div className="group-bar">
        <div>
          <div className={`group-name ${theme}`}>{t.meetings}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{group.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="back-link" style={{ marginBottom: 0 }} onClick={() => navigate(-1)}>← Back</button>
          {canCreate && (
            <button className={`upload-btn ${theme}`} onClick={() => setShowForm(true)}>+ {t.newMeeting}</button>
          )}
        </div>
      </div>

      <div className="list">
        {list.length === 0 && <div className="empty">No meeting links yet.</div>}
        {list.map((m) => (
          <div key={m.meetingId} className={`card ${theme}`} style={{ cursor: 'default', alignItems: 'flex-start' }}>
            <div className={`card-icon ${isSchool ? 'green-ic' : ''}`}>🔗</div>
            <div style={{ flex: 1 }}>
              <div className="card-title">{m.title}</div>
              <div className="card-sub">{m.description || '—'}</div>
              {m.scheduledAt && <div className="card-sub">🕒 {m.scheduledAt}</div>}
              <a href={m.url} target="_blank" rel="noreferrer" className={`meeting-link ${theme}`}>
                {m.url}
              </a>
              <div className="card-sub" style={{ marginTop: 2 }}>By {m.createdBy}</div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 440 }}>
            <div className={`modal-title ${theme}`}>{t.newMeeting}</div>

            <label className="label">Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Live doubt class" />

            <label className="label">Meeting URL (Zoom / Google Meet)</label>
            <input className="input" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://meet.google.com/…" />

            <label className="label">Description</label>
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What will be covered" />

            <label className="label">When (optional)</label>
            <input className="input" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
              placeholder="e.g. Tomorrow 6 PM" />

            <div className="modal-btns">
              <button className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button className={`confirm-btn ${theme}`} onClick={post}>Post & Notify</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
