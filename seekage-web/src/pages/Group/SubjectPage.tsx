import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth, T } from '../../utils/AuthContext';
import { useData, ContentKind } from '../../utils/DataContext';
import {
  createQuestion,
  deleteContentById,
  fetchContent,
  fetchGroups,
  fetchQuestionsByContent,
  fetchSubjectsByGroup,
  hideContentByParent,
} from '../../utils/api';
import { ContentViewLocationState } from './CourseView';

const TABS: Array<'all' | ContentKind> = ['all', 'video', 'note', 'document', 'assignment'];

interface ApiQuestion {
  question_id: number;
  content_id: number;
  group_id: number;
  subject_id: number;
  question_text: string;
  asked_by_name: string;
  answers: null | string | Array<{ text: string; by: string }>;
}

function normalizeAnswers(answers: ApiQuestion['answers']) {
  if (!answers) return [];
  if (Array.isArray(answers)) return answers;
  try {
    return JSON.parse(answers) as Array<{ text: string; by: string }>;
  } catch {
    return [];
  }
}

function contentIcon(kind: ContentKind) {
  if (kind === 'video') return '🎬';
  if (kind === 'document') return '📄';
  if (kind === 'assignment') return '📑';
  return '📝';
}

export default function SubjectPage() {
  const { groupId = '', subjectId = '' } = useParams();
  const decoded = decodeURIComponent(groupId);
  const { user, lang } = useAuth();
  const {
    groups,
    setGroupsData,
    subjects,
    setSubjectsData,
    content,
    setContentData,
    toggleHide,
    deleteContent,
  } = useData();
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
  const [qaPickerOpen, setQaPickerOpen] = useState(false);
  const [qaModal, setQaModal] = useState<null | { contentId: number; title: string; fileName: string }>(null);
  const [question, setQuestion] = useState('');
  const [questions, setQuestions] = useState<ApiQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

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
    if (!Number.isInteger(apiGroupId)) return;

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

    fetchContent(apiGroupId, user.token)
      .then((response) => {
        setContentData(response.data.map((row: any) => ({
          contentId: row.content_id,
          subjectId: String(row.subject_id),
          kind: row.content_type,
          title: row.title,
          fileName: row.file_name || row.file_url || 'content',
          fileUrl: row.file_url,
          hiddenByParent: Boolean(row.is_hidden_by_parent),
          uploadedBy: String(row.uploader_id || ''),
        })));
      })
      .catch((err) => alert(err?.response?.data?.message || 'Failed to load content'));
  }, [decoded, groups, setContentData, setGroupsData, setSubjectsData, user?.token]);

  useEffect(() => {
    if (!qaModal || !user?.token) return;

    const apiSubjectId = Number(subjectId);
    if (!Number.isInteger(apiSubjectId)) return;

    setQuestionsLoading(true);
    fetchQuestionsByContent(qaModal.contentId, apiSubjectId, user.token)
      .then((response) => setQuestions(response.data))
      .catch((err) => alert(err?.response?.data?.message || 'Failed to load questions'))
      .finally(() => setQuestionsLoading(false));
  }, [qaModal, subjectId, user?.token]);

  if (!group || !subject) return <div className="empty">Subject not found.</div>;

  const subjectContent = content.filter((c) => c.subjectId === subjectId);
  const visible = subjectContent.filter((c) => (activeTab === 'all' ? true : c.kind === activeTab));
  const qaItems = visible.filter((c) => !(isStudent && c.hiddenByParent));
  const counts = TABS.reduce((acc, tab) => {
    acc[tab] = tab === 'all'
      ? subjectContent.length
      : subjectContent.filter((item) => item.kind === tab).length;
    return acc;
  }, {} as Record<'all' | ContentKind, number>);

  function openContentView(c: (typeof content)[number]) {
    const state: ContentViewLocationState = {
      contentId: c.contentId,
      title: c.title,
      fileName: c.fileName,
      fileUrl: c.fileUrl,
      kind: c.kind as ContentViewLocationState['kind'],
    };
    navigate(
      `/group/${encodeURIComponent(decoded)}/subject/${subjectId}/content/${c.contentId}`,
      { state }
    );
  }

  function askHide(c: (typeof content)[number]) {
    setModal({ contentId: c.contentId, title: c.title, currentlyHidden: c.hiddenByParent });
    setPw('');
  }

  async function confirmHide() {
    if (!modal || !user) return;

    const apiGroupId = Number(decoded);
    const apiSubjectId = Number(subjectId);

    if (!user.token || !Number.isInteger(apiGroupId) || !Number.isInteger(apiSubjectId)) {
      alert('This action needs backend content, group, and subject ids.');
      return;
    }

    try {
      await hideContentByParent({
        content_id: modal.contentId,
        group_id: apiGroupId,
        subject_id: apiSubjectId,
        password: pw,
      }, user.token);
      toggleHide(modal.contentId);
      setModal(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Unable to hide content');
    }
  }

  function openQa(c: (typeof content)[number]) {
    setQaPickerOpen(false);
    setQaModal({ contentId: c.contentId, title: c.title, fileName: c.fileName });
    setQuestion('');
    setQuestions([]);
  }

  function openQaFromBottom() {
    if (qaItems.length === 0) {
      alert('No available content found for Q&A.');
      return;
    }

    if (qaItems.length === 1) {
      openQa(qaItems[0]);
      return;
    }

    setQaPickerOpen(true);
  }

  async function submitQuestion() {
    const text = question.trim();
    if (!qaModal || !user?.token || !text) return;

    const apiGroupId = Number(decoded);
    const apiSubjectId = Number(subjectId);

    if (!Number.isInteger(apiGroupId) || !Number.isInteger(apiSubjectId)) {
      alert('This action needs backend content, group, and subject ids.');
      return;
    }

    try {
      const response = await createQuestion({
        content_id: qaModal.contentId,
        group_id: apiGroupId,
        subject_id: apiSubjectId,
        question: text,
      }, user.token);

      setQuestions((prev) => [{
        question_id: response.data.questionId,
        content_id: response.data.contentId,
        group_id: response.data.groupId,
        subject_id: response.data.subjectId,
        question_text: text,
        asked_by_name: user.name,
        answers: [],
      }, ...prev]);
      setQuestion('');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to post question');
    }
  }

  return (
    <>
      <div className="group-bar">
        <div>
          <div className={`group-name ${themeClass}`}>{subject.name}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{group.name}</div>
        </div>
        {canUpload && (
          <Link to={`/group/${encodeURIComponent(decoded)}/subject/${subjectId}/upload`}
            className={`upload-btn ${themeClass}`}>+ {t.upload}</Link>
        )}
      </div>

      <div className="subject-workspace">
        <aside className={`subject-sidebar ${themeClass}`}>
          <div className="side-panel-title">Content Library</div>
          <div className="side-panel-copy">Filter lessons, notes, documents, and assignments.</div>
          <div className="side-menu">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={activeTab === tab ? 'active' : ''}
                onClick={() => setActiveTab(tab)}
              >
                <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                <b>{counts[tab]}</b>
              </button>
            ))}
          </div>
        </aside>

        <main className="subject-main">
          <div className="content-panel-header">
            <div>
              <div className="panel-kicker">{activeTab === 'all' ? 'All content' : activeTab}</div>
              <h2>{subject.name}</h2>
            </div>
            <span>{visible.length} item{visible.length === 1 ? '' : 's'}</span>
          </div>

          <div className="content-list">
            {visible.length === 0 && <div className="empty">No content here yet.</div>}
            {visible.map((c) => {
              const locked = isStudent && c.hiddenByParent;
              const isPlayable = c.kind === 'video' && !locked;
              const isViewable = (c.kind === 'document' || c.kind === 'assignment') && !locked;
              const isClickable = isPlayable || isViewable;

              return (
                <div
                  key={c.contentId}
                  className={`card ${themeClass}`}
                  style={{ cursor: isClickable ? 'pointer' : 'default', opacity: locked ? 0.55 : 1 }}
                  onClick={isClickable ? () => openContentView(c) : undefined}
                >
                  <div className={`card-icon ${isSchool ? 'green-ic' : ''}`}>{contentIcon(c.kind)}</div>
                  <div style={{ flex: 1 }}>
                    <div className="card-title">{c.title}</div>
                    <div className="card-sub">
                      {c.kind} - {c.fileName}
                      {isPlayable ? ' - Tap to play' : ''}
                    </div>
                    {c.hiddenByParent && <div className="hidden-label">Hidden by parent</div>}
                  </div>
                  {isStudent && (
                    <button
                      className={`zero-btn ${c.hiddenByParent ? 'on' : ''}`}
                      onClick={(e) => { e.stopPropagation(); askHide(c); }}
                      title={c.hiddenByParent ? t.unhide : t.hide}
                      aria-label={c.hiddenByParent ? t.unhide : t.hide}
                    >
                      0
                    </button>
                  )}
                  {!locked && (
                    <button
                      className={`hide-btn ${themeClass}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openQa(c);
                      }}
                    >
                      Q&A
                    </button>
                  )}
                  {canDelete && (
                    <button
                      className="hide-btn warn"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!user?.token) return;
                        try {
                          await deleteContentById(c.contentId, user.token);
                          deleteContent(c.contentId);
                        } catch (err: any) {
                          alert(err?.response?.data?.message || 'Failed to delete content');
                        }
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </main>

        <aside className={`subject-actions ${themeClass}`}>
          <div className="side-panel-title">Actions</div>
          <div className="side-panel-copy">Upload content, ask questions, or open class communication.</div>
          {canUpload && (
            <Link
              to={`/group/${encodeURIComponent(decoded)}/subject/${subjectId}/upload`}
              className={`action-primary ${themeClass}`}
            >
              + {t.upload}
            </Link>
          )}
          <button type="button" className="action-secondary" onClick={openQaFromBottom}>💬 {t.qa}</button>
          <Link className="action-secondary" to={`/group/${encodeURIComponent(decoded)}/subject/${subjectId}/chat`}>🗨 {t.chat}</Link>
          <Link className="action-secondary" to={`/group/${encodeURIComponent(decoded)}/subject/${subjectId}/meetings`}>🔗 {t.meetings}</Link>
        </aside>
      </div>

      <div className="bottom-nav">
        <button type="button" onClick={openQaFromBottom}>💬 {t.qa}</button>
        <Link to={`/group/${encodeURIComponent(decoded)}/subject/${subjectId}/chat`}>🗨 {t.chat}</Link>
        <Link to={`/group/${encodeURIComponent(decoded)}/subject/${subjectId}/meetings`}>🔗 {t.meetings}</Link>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className={`modal-title ${themeClass}`}>
              {modal.currentlyHidden ? 'Unhide' : 'Hide'} - {modal.title}
            </div>
            <div className="modal-sub">
              Enter the parent password set by admin. Parents can change it later.
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

      {qaPickerOpen && (
        <div className="modal-overlay" onClick={() => setQaPickerOpen(false)}>
          <div className="modal-box qa-picker-box" onClick={(e) => e.stopPropagation()}>
            <div className={`modal-title ${themeClass}`}>Choose content</div>
            <div className="modal-sub">Select the content this question belongs to.</div>
            <div className="qa-picker-list">
              {qaItems.map((item) => (
                <button
                  key={item.contentId}
                  type="button"
                  className="qa-picker-item"
                  onClick={() => openQa(item)}
                >
                  <span className="card-title">{item.title}</span>
                  <span className="card-sub">{item.kind} - {item.fileName}</span>
                </button>
              ))}
            </div>
            <div className="modal-btns">
              <button className="cancel-btn" onClick={() => setQaPickerOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {qaModal && (
        <div className="modal-overlay" onClick={() => setQaModal(null)}>
          <div className="qa-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="qa-modal-header">
              <div>
                <div className={`modal-title ${themeClass}`}>Q&A - {qaModal.title}</div>
                <div className="modal-sub">{qaModal.fileName}</div>
              </div>
              <button className="cancel-btn qa-close-btn" onClick={() => setQaModal(null)} aria-label="Close Q&A">
                x
              </button>
            </div>

            <div className="qa-modal-list">
              {questionsLoading && <div className="empty">Loading questions...</div>}
              {!questionsLoading && questions.length === 0 && <div className="empty">No questions yet.</div>}
              {!questionsLoading && questions.map((item) => (
                <div key={item.question_id} className="qa-card">
                  <p className="qa-q">Q: {item.question_text}</p>
                  <p className="qa-by">- {item.asked_by_name}</p>
                  {normalizeAnswers(item.answers).map((answer, index) => (
                    <div key={index} className={`answer-box ${isSchool ? 'green-answer' : ''}`}>
                      <p className="answer-text">A: {answer.text}</p>
                      <p className="answer-by">- {answer.by}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="ask-bar qa-modal-ask">
              <input
                className="input"
                placeholder={t.typeQuestion}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitQuestion();
                }}
              />
              <button className={`ask-btn ${themeClass}`} onClick={submitQuestion}>{t.send}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
