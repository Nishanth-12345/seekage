import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, T } from '../../utils/AuthContext';
import { useData } from '../../utils/DataContext';
import { createGroup, fetchSchoolGroups } from '../../utils/api';

export default function SchoolHome() {
  const { user, lang, logout } = useAuth();
  const { groups, setGroupsData, addGroup } = useData();
  const t = T[lang];
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  const isTeacher = user?.role === 'teacher';
  const code = user?.schoolCode;
  const myGroups = groups.filter((g) => (
    g.portal === 'seekage' || (g.portal === 'school' && g.schoolCode === code)
  ));

  useEffect(() => {
    if (!user?.token || !user.schoolId || !code) return;

    fetchSchoolGroups(user.schoolId, user.token)
      .then((response) => {
        setGroupsData(response.data.map((row: any) => ({
            groupId: String(row.group_id),
            portal: row.group_type === 'school_based' ? 'school' : 'seekage',
            schoolCode: row.school_code || code,
            schoolId: row.school_id,
            name: row.group_name,
            teacher: row.group_type === 'school_based' ? user.name : undefined,
            subjectCount: Number(row.subject_count || 0),
          })));
      })
      .catch((err) => alert(err?.response?.data?.message || 'Failed to load classes'));
  }, [code, setGroupsData, user?.name, user?.schoolId, user?.token]);

  async function addGroupHandler() {
    if (!newName.trim()) { alert('Enter group name'); return; }

    try {
      if (user?.token && user.schoolId) {
        const response = await createGroup({
          group_name: newName.trim(),
          group_type: 'school_based',
          school_id: user.schoolId,
        }, user.token);

        addGroup({
          groupId: String(response.data.groupId),
          portal: 'school',
          schoolCode: code,
          name: response.data.groupName,
          teacher: user?.name,
        });
      }
      setNewName('');
      setShowAdd(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create class');
    }
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

      <section className="dashboard-summary green">
        <div>
          <div className="summary-label">School workspace</div>
          <p className="summary-copy">
            Review school classes and shared Seekage groups, then open a group to manage subjects, content, Q&A, chat, and meetings.
          </p>
        </div>
        <div className="summary-metric">
          <strong>{myGroups.length}</strong>
          <span>{myGroups.length === 1 ? 'group' : 'groups'}</span>
        </div>
      </section>

      <div className="title-row">
        <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{t.groups}</div>
        {isTeacher && (
          <button className="add-btn green" onClick={() => setShowAdd(true)}>+ Add Class</button>
        )}
      </div>

      <div className="list">
        {myGroups.length === 0 && <div className="empty">No groups yet.</div>}
        {myGroups.map((g) => {
          const subjCount = g.subjectCount || 0;
          return (
            <div key={g.groupId} className={`card ${g.portal === 'school' ? 'green' : ''}`}
              onClick={() => navigate(`/group/${encodeURIComponent(g.groupId)}`)}>
              <div className={`card-icon ${g.portal === 'school' ? 'green-ic' : ''}`}>
                {g.portal === 'school' ? '🏫' : '📚'}
              </div>
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
