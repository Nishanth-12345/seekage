import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, T } from '../../utils/AuthContext';
import { useData } from '../../utils/DataContext';

export default function SchoolHome() {
  const { user, lang, logout } = useAuth();
  const { groups, subjects, addGroup } = useData();
  const t = T[lang];
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  const isTeacher = user?.role === 'teacher';
  const code = user?.schoolCode;
  const myGroups = groups.filter((g) => g.portal === 'school' && g.schoolCode === code);

  function addGroupHandler() {
    if (!newName.trim()) { alert('Enter group name'); return; }
    addGroup({
      groupId: `school-${code}-${Date.now()}`,
      portal: 'school',
      schoolCode: code,
      name: newName.trim(),
      teacher: user?.name,
    });
    setNewName('');
    setShowAdd(false);
  }

  return (
    <>
      <header className="page-header green">
        <div>
          <div className="greeting">School · {user?.schoolCode || '—'}</div>
          <h1>{user?.name}</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="role-pill">{user?.role}</div>
          <div><button className="logout-link" onClick={logout}>{t.logout}</button></div>
        </div>
      </header>

      <div className="title-row">
        <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{t.groups}</div>
        {isTeacher && (
          <button className="add-btn green" onClick={() => setShowAdd(true)}>+ Add Class</button>
        )}
      </div>

      <div className="list">
        {myGroups.length === 0 && <div className="empty">No classes yet.</div>}
        {myGroups.map((g) => {
          const subjCount = subjects.filter((s) => s.groupId === g.groupId).length;
          return (
            <div key={g.groupId} className="card green"
              onClick={() => navigate(`/group/${encodeURIComponent(g.groupId)}`)}>
              <div className="card-icon green-ic">🏫</div>
              <div style={{ flex: 1 }}>
                <div className="card-title">{g.name}</div>
                <div className="card-sub">
                  {subjCount} {subjCount === 1 ? 'subject' : 'subjects'}
                  {g.teacher ? ` · ${g.teacher}` : ''}
                </div>
              </div>
              <span className="card-arrow">›</span>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-title green">New Class</div>
            <input className="input" placeholder="e.g. Class 7A"
              value={newName} onChange={(e) => setNewName(e.target.value)} />
            <div className="modal-btns">
              <button className="cancel-btn" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="confirm-btn green" onClick={addGroupHandler}>Create</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
