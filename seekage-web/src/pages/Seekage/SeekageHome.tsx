import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, T, AGE_GROUPS } from '../../utils/AuthContext';
import { useData } from '../../utils/DataContext';
import { fetchGroups } from '../../utils/api';

export default function SeekageHome() {
  const { user, lang, logout } = useAuth();
  const { groups, setGroupsData } = useData();
  const t = T[lang];
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  useEffect(() => {
    if (!user?.token) return;

    fetchGroups(user.token)
      .then((response) => {
        setGroupsData(response.data.map((row: any) => ({
          groupId: String(row.group_id),
          portal: row.group_type === 'school_based' ? 'school' : 'seekage',
          name: row.group_name,
          schoolId: row.school_id,
          schoolCode: row.school_code,
          subjectCount: Number(row.subject_count || 0),
        })));
      })
      .catch((err) => alert(err?.response?.data?.message || 'Failed to load groups'));
  }, [setGroupsData, user?.token]);

  const myGroupId = user?.groupId ? String(user.groupId) : null;
  const visibleGroups = isAdmin
    ? groups.filter((g) => g.portal === 'seekage')
    : groups.filter((g) => g.groupId === myGroupId);

  return (
    <>
      <header className="page-header">
        <div>
          <div className="greeting">Seekage · {isAdmin ? 'Admin console' : 'Welcome back'}</div>
          <h1>{user?.name || 'User'}</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="role-pill">{user?.role}{user?.ageGroup ? ` · ${user.ageGroup}` : ''}</div>
          <div><button className="logout-link" onClick={logout}>{t.logout}</button></div>
        </div>
      </header>

      <section className="dashboard-summary">
        <div>
          <div className="summary-label">{isAdmin ? 'Learning operations' : 'Current learning space'}</div>
          <p className="summary-copy">
            {isAdmin
              ? 'Manage Seekage age groups, subjects, uploaded lessons, student questions, and parent controls from one place.'
              : 'Open your assigned group to continue lessons, view documents, ask questions, and follow meeting links.'}
          </p>
        </div>
        <div className="summary-metric">
          <strong>{visibleGroups.length}</strong>
          <span>{visibleGroups.length === 1 ? 'group' : 'groups'}</span>
        </div>
      </section>

      <div className="section-title">{isAdmin ? 'All Age Groups' : 'Your Group'}</div>

      <div className="list">
        {visibleGroups.length === 0 && (
          <div className="empty">No group assigned. Ask your admin to set your age group.</div>
        )}
        {visibleGroups.map((g) => {
          const subjCount = g.subjectCount || 0;
          const meta = AGE_GROUPS.find((a) => user?.ageGroup === a.id);
          return (
            <div key={g.groupId} className="card"
              onClick={() => navigate(`/group/${encodeURIComponent(g.groupId)}`)}>
              <div className="card-icon">📚</div>
              <div style={{ flex: 1 }}>
                <div className="card-title">{g.name}</div>
                <div className="card-sub">
                  {subjCount} {subjCount === 1 ? 'subject' : 'subjects'}
                  {meta ? ` · ${meta.range}` : ''}
                </div>
              </div>
              <span className="card-arrow">›</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
