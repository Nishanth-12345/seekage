import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth, T } from '../../utils/AuthContext';
import { useData, ContentKind } from '../../utils/DataContext';

const TYPES: ContentKind[] = ['video', 'note', 'document', 'assignment'];

export default function UploadPage() {
  const { groupId = '', subjectId = '' } = useParams();
  const decoded = decodeURIComponent(groupId);
  const { user, lang } = useAuth();
  const { groups, subjects, addContent } = useData();
  const t = T[lang];
  const navigate = useNavigate();
  const group = groups.find((g) => g.groupId === decoded);
  const subject = subjects.find((s) => s.subjectId === subjectId);
  const isSchool = group?.portal === 'school';

  const [kind, setKind] = useState<ContentKind>('video');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !file) { alert('Fill title and pick a file'); return; }
    addContent({
      contentId: Date.now(),
      subjectId,
      kind,
      title: title.trim(),
      fileName: file.name,
      hiddenByParent: false,
      uploadedBy: user?.name || 'Unknown',
    });
    alert('Uploaded (mock).');
    navigate(-1);
  }

  if (!group || !subject) return <div className="empty">Not found.</div>;

  return (
    <div style={{ padding: 20 }}>
      <button className="back-link" onClick={() => navigate(-1)}>← Back</button>

      <div className={`info-box ${isSchool ? 'green' : ''}`}>
        Uploading to <b>{subject.name}</b> · {group.name}
      </div>

      <label className="label">Content type</label>
      <div className="type-row">
        {TYPES.map((tp) => (
          <button key={tp} type="button"
            className={`type-btn ${kind === tp ? 'active' : ''}`}
            style={isSchool && kind === tp ? { background: 'var(--green)', borderColor: 'var(--green)' } : undefined}
            onClick={() => setKind(tp)}>
            {tp.charAt(0).toUpperCase() + tp.slice(1)}
          </button>
        ))}
      </div>

      <form onSubmit={submit}>
        <label className="label">Title</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Chapter 3 – Fractions" />

        <label className="label">File</label>
        <label className="file-picker">
          <input type="file" hidden
            accept={kind === 'video' ? 'video/*' : '*/*'}
            onChange={(e) => setFile(e.target.files?.[0] || null)} />
          {file ? `📎 ${file.name}` : '📁 Click to select file'}
        </label>

        <button className={`btn ${isSchool ? 'btn-green' : ''}`} type="submit" style={{ marginTop: 24 }}>
          ⬆ {t.upload}
        </button>
      </form>
    </div>
  );
}
