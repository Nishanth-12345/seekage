import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth, T } from '../../utils/AuthContext';
import { useData, ContentKind } from '../../utils/DataContext';
import VideoPlayer from '../../components/VideoPlayer';

const TABS: Array<'all' | ContentKind> = ['all', 'video', 'note', 'document'];

export default function SubjectPage() {
  const { groupId = '', subjectId = '' } = useParams();
  const decoded = decodeURIComponent(groupId);
  const { user, lang, verifyParentPassword } = useAuth();
  const { groups, subjects, content, toggleHide, deleteContent } = useData();
  const t = T[lang];
  const navigate = useNavigate();

  const group = groups.find((g) => g.groupId === decoded);
  const subject = subjects.find((s) => s.subjectId === subjectId);
  const isSchool = group?.portal === 'school';
  const themeClass = isSchool ? 'green' : '';

  const canUpload = user && (user.role === 'admin' || (isSchool && user.role === 'teacher'));
  const canDelete = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const [activeTab, setActiveTab] = useState<'all' | ContentKind>('all');
  const [modal, setModal] = useState<null | { contentId: number; title: string; currentlyHidden: boolean }>(null);
  const [pw, setPw] = useState('');
  const [playing, setPlaying] = useState<null | { contentId: number; title: string; fileName: string }>(null);

  if (!group || !subject) return <div className="empty">Subject not found.</div>;

  const items = content
    .filter((c) => c.subjectId === subjectId)
    .filter((c) => (activeTab === 'all' ? true : c.kind === activeTab));
  const visible = items;

  function askHide(c: (typeof content)[number]) {
    setModal({ contentId: c.contentId, title: c.title, currentlyHidden: c.hiddenByParent });
    setPw('');
  }

  function confirmHide() {
    if (!modal || !user) return;
    if (!verifyParentPassword(user.phone, pw)) {
      alert('Wrong parent password. Contact admin.');
      return;
    }
    toggleHide(modal.contentId);
    setModal(null);
  }

  return (
    <>
      <div className={`group-bar`}>
        <div>
          <div className={`group-name ${themeClass}`}>{subject.name}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{group.name}</div>
        </div>
        {canUpload && (
          <Link to={`/group/${encodeURIComponent(decoded)}/subject/${subjectId}/upload`}
            className={`upload-btn ${themeClass}`}>+ {t.upload}</Link>
        )}
      </div>

      <div className={`tab-strip ${themeClass}`}>
        {TABS.map((tab) => (
          <button key={tab} className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="list">
        {visible.length === 0 && <div className="empty">No content here yet.</div>}
        {visible.map((c) => {
          const icon = c.kind === 'video' ? '🎬' : c.kind === 'document' ? '📄' : c.kind === 'assignment' ? '📑' : '📝';
          const locked = isStudent && c.hiddenByParent;
          const isPlayable = c.kind === 'video' && !locked;
          return (
            <div
              key={c.contentId}
              className={`card ${themeClass}`}
              style={{ cursor: isPlayable ? 'pointer' : 'default', opacity: locked ? 0.55 : 1 }}
              onClick={isPlayable ? () => setPlaying({ contentId: c.contentId, title: c.title, fileName: c.fileName }) : undefined}
            >
              <div className={`card-icon ${isSchool ? 'green-ic' : ''}`}>{icon}</div>
              <div style={{ flex: 1 }}>
                <div className="card-title">{c.title}</div>
                <div className="card-sub">
                  {c.kind} · {c.fileName}
                  {isPlayable ? ' · ▶ Tap to play' : ''}
                </div>
                {c.hiddenByParent && <div className="hidden-label">🔒 Hidden by parent</div>}
              </div>
              {isStudent && (
                <button
                  className={`zero-btn ${c.hiddenByParent ? 'on' : ''}`}
                  onClick={(e) => { e.stopPropagation(); askHide(c); }}
                  title={c.hiddenByParent ? t.unhide : t.hide}
                  aria-label={c.hiddenByParent ? t.unhide : t.hide}>
                  0
                </button>
              )}
              {canDelete && (
                <button
                  className="hide-btn warn"
                  onClick={(e) => { e.stopPropagation(); deleteContent(c.contentId); }}>
                  Delete
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="bottom-nav">
        <Link to={`/group/${encodeURIComponent(decoded)}/subject/${subjectId}/qa`}>💬 {t.qa}</Link>
        <Link to={`/group/${encodeURIComponent(decoded)}/subject/${subjectId}/chat`}>🗨 {t.chat}</Link>
        <Link to={`/group/${encodeURIComponent(decoded)}/subject/${subjectId}/meetings`}>🔗 {t.meetings}</Link>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className={`modal-title ${themeClass}`}>
              {modal.currentlyHidden ? 'Unhide' : 'Hide'} — {modal.title}
            </div>
            <div className="modal-sub">
              Enter the parent password (set by admin). Parents can change it later.
            </div>
            <input className="input" type="password" placeholder="Parent password"
              value={pw} onChange={(e) => setPw(e.target.value)} />
            <div className="modal-btns">
              <button className="cancel-btn" onClick={() => setModal(null)}>Cancel</button>
              <button className={`confirm-btn ${themeClass}`} onClick={confirmHide}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {playing && (
        <VideoPlayer
          contentId={playing.contentId}
          title={playing.title}
          fileName={playing.fileName}
          onClose={() => setPlaying(null)}
        />
      )}
    </>
  );
}
