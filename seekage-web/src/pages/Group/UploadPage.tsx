import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth, T } from '../../utils/AuthContext';
import { useData, ContentKind } from '../../utils/DataContext';
import { uploadContent } from '../../utils/api';
import { uploadContentFileToFirebase } from '../../utils/firebaseStorage';

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
  const [uploading, setUploading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !file) { alert('Fill title and pick a file'); return; }
    if (!user?.token) { alert('Please login again'); return; }

    const apiGroupId = Number(decoded);
    const apiSubjectId = Number(subjectId);

    if (!Number.isInteger(apiGroupId) || !Number.isInteger(apiSubjectId)) {
      alert('This upload needs backend group_id and subject_id numbers.');
      return;
    }

    setUploading(true);

    try {
      const { downloadUrl } = await uploadContentFileToFirebase(file, decoded, subjectId);
      const response = await uploadContent({
        group_id: apiGroupId,
        subject_id: apiSubjectId,
        subject_name: subject?.name,
        content_type: kind,
        title: title.trim(),
        file_url: downloadUrl,
      }, user.token);

      addContent({
        contentId: response.data?.contentId || Date.now(),
        subjectId,
        kind,
        title: title.trim(),
        fileName: file.name,
        hiddenByParent: false,
        uploadedBy: user.name,
      });

      alert('Uploaded.');
      navigate(-1);
    } catch (err) {
      alert('Upload failed: ' + (err instanceof Error ? err.message : 'unknown error'));
    } finally {
      setUploading(false);
    }
  }

  if (!group || !subject) return <div className="empty">Not found.</div>;

  return (
    <div style={{ padding: 20 }}>
      <button className="back-link" onClick={() => navigate(-1)}>Back</button>

      <div className={`info-box ${isSchool ? 'green' : ''}`}>
        Uploading to <b>{subject.name}</b> - {group.name}
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
          placeholder="e.g. Chapter 3 - Fractions" />

        <label className="label">File</label>
        <label className="file-picker">
          <input type="file" hidden
            accept={kind === 'video' ? 'video/*' : kind === 'document' ? 'application/pdf,.pdf' : '*/*'}
            onChange={(e) => setFile(e.target.files?.[0] || null)} />
          {file ? `Selected: ${file.name}` : 'Click to select file'}
        </label>

        <button className={`btn ${isSchool ? 'btn-green' : ''}`} type="submit" style={{ marginTop: 24 }} disabled={uploading}>
          {uploading ? 'Uploading...' : t.upload}
        </button>
      </form>
    </div>
  );
}
