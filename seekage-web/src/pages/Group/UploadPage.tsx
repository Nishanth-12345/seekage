import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth, T } from '../../utils/AuthContext';
import { useData, ContentKind } from '../../utils/DataContext';
import { fetchGroups, fetchSubjectsByGroup, uploadContent } from '../../utils/api';

const TYPES: ContentKind[] = ['video', 'note', 'document', 'assignment'];

const TYPE_COPY: Record<ContentKind, string> = {
  video: 'Upload recorded lessons or explainers.',
  note: 'Share notes, summaries, and study material.',
  document: 'Attach PDF documents for reading.',
  assignment: 'Publish tasks or worksheets for students.',
};

function typeIcon(kind: ContentKind) {
  if (kind === 'video') return '🎬';
  if (kind === 'document') return '📄';
  if (kind === 'assignment') return '📑';
  return '📝';
}

export default function UploadPage() {
  const { groupId = '', subjectId = '' } = useParams();
  const decoded = decodeURIComponent(groupId);
  const { user, lang } = useAuth();
  const { groups, setGroupsData, subjects, setSubjectsData, addContent } = useData();
  const t = T[lang];
  const navigate = useNavigate();
  const group = groups.find((g) => g.groupId === decoded);
  const subject = subjects.find((s) => s.subjectId === subjectId);
  const isSchool = group?.portal === 'school';
  const themeClass = isSchool ? 'green' : '';

  const [kind, setKind] = useState<ContentKind>('video');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user?.token) return;

    if (!groups.some((g) => g.groupId === decoded)) {
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
    }

    const apiGroupId = Number(decoded);
    if (Number.isInteger(apiGroupId)) {
      fetchSubjectsByGroup(apiGroupId, user.token)
        .then((response) => {
          setSubjectsData(response.data.map((row: any) => ({
            subjectId: String(row.subject_id),
            groupId: String(row.group_id),
            name: row.subject_name,
            createdBy: row.created_by_name || row.instructor_name || 'User',
          })));
        })
        .catch((err) => alert(err?.response?.data?.message || 'Failed to load subjects'));
    }
  }, [decoded, groups, setGroupsData, setSubjectsData, user?.token]);

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
      const formData = new FormData();
      formData.append('group_id', String(apiGroupId));
      formData.append('subject_id', String(apiSubjectId));
      if (subject?.name) formData.append('subject_name', subject.name);
      formData.append('content_type', kind);
      formData.append('title', title.trim());

      const uploadBlob = kind === 'video'
        ? file.slice(0, file.size, file.type || 'video/mp4')
        : file;
      formData.append('file', uploadBlob, file.name);

      const response = await uploadContent(formData, user.token);

      addContent({
        contentId: response.data?.contentId || Date.now(),
        subjectId,
        kind,
        title: title.trim(),
        fileName: file.name,
        fileUrl: response.data?.url,
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
    <>
      <div className="group-bar">
        <div>
          <div className={`group-name ${themeClass}`}>Upload Content</div>
          <div style={{ fontSize: 11, color: '#888' }}>{subject.name} - {group.name}</div>
        </div>
        <button className="back-link compact" onClick={() => navigate(-1)}>Back</button>
      </div>

      <div className="upload-workspace">
        <aside className={`upload-sidebar ${themeClass}`}>
          <div className="side-panel-title">Content Type</div>
          <div className="side-panel-copy">Choose what you are adding to this subject.</div>
          <div className="side-menu">
            {TYPES.map((tp) => (
              <button
                key={tp}
                type="button"
                className={kind === tp ? 'active' : ''}
                onClick={() => {
                  setKind(tp);
                  setFile(null);
                }}
              >
                <span>{typeIcon(tp)} {tp.charAt(0).toUpperCase() + tp.slice(1)}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="upload-form-panel">
          <div className="content-panel-header">
            <div>
              <div className="panel-kicker">{kind}</div>
              <h2>{typeIcon(kind)} Add {kind.charAt(0).toUpperCase() + kind.slice(1)}</h2>
            </div>
          </div>

          <div className={`info-box ${themeClass}`}>
            {TYPE_COPY[kind]} This upload will be attached to <b>{subject.name}</b>.
          </div>

          <form onSubmit={submit}>
            <label className="label">Title</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 3 - Fractions"
            />

            <label className="label">File</label>
            <label className="file-picker upload-dropzone">
              <input
                type="file"
                hidden
                accept={
                  kind === 'video'
                    ? 'video/*'
                    : kind === 'document'
                      ? '.pdf,application/pdf'
                      : '*/*'
                }
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];

                  if (
                    kind === 'document' &&
                    selectedFile &&
                    selectedFile.type !== 'application/pdf'
                  ) {
                    alert('Only PDF files are allowed');
                    return;
                  }

                  setFile(selectedFile || null);
                }}
              />

              <span className="upload-dropzone-icon">{typeIcon(kind)}</span>
              <strong>{file ? file.name : 'Click to select file'}</strong>
              <small>{kind === 'document' ? 'PDF files only' : 'Choose a file from this device'}</small>
            </label>

            <button className={`btn ${isSchool ? 'btn-green' : ''}`} type="submit" style={{ marginTop: 24 }} disabled={uploading}>
              {uploading ? 'Uploading...' : t.upload}
            </button>
          </form>
        </main>
      </div>
    </>
  );
}
