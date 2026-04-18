import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth, T } from '../../utils/AuthContext';
import { useData } from '../../utils/DataContext';

export default function GroupPage() {
  const { groupId = '' } = useParams();
  const decoded = decodeURIComponent(groupId);
  const { user, lang } = useAuth();
  const { groups, subjects, addSubject, meetings, readMeetings } = useData();
  const t = T[lang];
  const navigate = useNavigate();

  const group = groups.find((g) => g.groupId === decoded);
  const isPortalSchool = group?.portal === 'school';
  const canManage = user && (user.role === 'admin' || (isPortalSchool && user.role === 'teacher'));

  const groupSubjects = subjects.filter((s) => s.groupId === decoded);
  const groupMeetings = meetings.filter((m) => m.groupId === decoded);
  const unread = groupMeetings.filter((m) => !readMeetings.includes(m.meetingId)).length;

  const [showAdd, setShowAdd] = useState(false);
  const [newSubject, setNewSubject] = useState('');

  if (!group) return <div className="empty">Group not found.</div>;

  function create() {
    if (!newSubject.trim()) return;
    addSubject({
      subjectId: `subj-${Date.now()}`,
      groupId: decoded,
      name: newSubject.trim(),
      createdBy: user?.name || 'User',
    });
    setNewSubject('');
    setShowAdd(false);
  }

  const themeClass = isPortalSchool ? 'green' : '';

  return (
    <>
      <header className={`page-header ${themeClass}`}>
        <div>
          <div className="greeting">{isPortalSchool ? 'Class' : 'Age Group'}</div>
          <h1>{group.name}</h1>
        </div>
        <button className="logout-link" onClick={() => navigate(-1)}>← Back</button>
      </header>

      <div className="title-row">
        <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{t.subjects}</div>
        {canManage && (
          <button className={`add-btn ${themeClass}`} onClick={() => setShowAdd(true)}>
            + {t.addSubject}
          </button>
        )}
      </div>

      <div className="list">
        {groupSubjects.length === 0 && <div className="empty">No subjects yet.</div>}
        {groupSubjects.map((sub) => (
          <div key={sub.subjectId} className={`card ${themeClass}`}
            onClick={() => navigate(`/group/${encodeURIComponent(decoded)}/subject/${sub.subjectId}`)}>
            <div className={`card-icon ${isPortalSchool ? 'green-ic' : ''}`}>📂</div>
            <div style={{ flex: 1 }}>
              <div className="card-title">{sub.name}</div>
              <div className="card-sub">Created by {sub.createdBy}</div>
            </div>
            <span className="card-arrow">›</span>
          </div>
        ))}

        <Link to={`/group/${encodeURIComponent(decoded)}/subject/none/meetings`} className={`card ${themeClass}`}>
          <div className={`card-icon ${isPortalSchool ? 'green-ic' : ''}`}>🔗</div>
          <div style={{ flex: 1 }}>
            <div className="card-title">
              {t.meetings}
              {unread > 0 && <span className="notif-dot" title={`${unread} new`}>{unread}</span>}
            </div>
            <div className="card-sub">Zoom / Google Meet links for this group</div>
          </div>
          <span className="card-arrow">›</span>
        </Link>
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className={`modal-title ${themeClass}`}>New Subject</div>
            <input className="input" placeholder="e.g. Mathematics"
              value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
            <div className="modal-btns">
              <button className="cancel-btn" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className={`confirm-btn ${themeClass}`} onClick={create}>Create</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
