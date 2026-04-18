import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, T, AGE_GROUPS } from '../../utils/AuthContext';
import { useData } from '../../utils/DataContext';

export default function SeekageHome() {
  const { user, lang, logout } = useAuth();
  const { groups, subjects } = useData();
  const t = T[lang];
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const myGroupId = user?.ageGroup ? `seekage-${user.ageGroup}` : null;
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

      <div className="section-title">{isAdmin ? 'All Age Groups' : 'Your Group'}</div>

      <div className="list">
        {visibleGroups.length === 0 && (
          <div className="empty">No group assigned. Ask your admin to set your age group.</div>
        )}
        {visibleGroups.map((g) => {
          const subjCount = subjects.filter((s) => s.groupId === g.groupId).length;
          const meta = AGE_GROUPS.find((a) => `seekage-${a.id}` === g.groupId);
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
