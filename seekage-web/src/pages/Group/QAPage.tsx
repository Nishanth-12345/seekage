import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth, T } from '../../utils/AuthContext';
import { useData } from '../../utils/DataContext';
import { createQuestion, fetchQuestionsByContent } from '../../utils/api';

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

export default function QAPage() {
  const { groupId = '', subjectId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const decoded = decodeURIComponent(groupId);
  const contentId = Number(searchParams.get('contentId'));
  const { user, lang } = useAuth();
  const { groups, qa, addQuestion, addAnswer } = useData();
  const t = T[lang];
  const group = groups.find((g) => g.groupId === decoded);
  const isSchool = group?.portal === 'school';
  const theme = isSchool ? 'green' : '';
  const canAnswer = user && (user.role === 'admin' || user.role === 'teacher' || user.role === 'counselor');

  const [question, setQuestion] = useState('');
  const [replyMap, setReplyMap] = useState<Record<number, string>>({});
  const [remoteQuestions, setRemoteQuestions] = useState<ApiQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  const apiGroupId = Number(decoded);
  const apiSubjectId = Number(subjectId);
  const canUseBackend = Boolean(user?.token && Number.isInteger(contentId) && Number.isInteger(apiSubjectId));
  const localList = qa.filter((q) => q.subjectId === subjectId);
  const list = canUseBackend
    ? remoteQuestions.map((item) => ({
        id: item.question_id,
        question: item.question_text,
        askedBy: item.asked_by_name,
        answers: normalizeAnswers(item.answers),
      }))
    : localList;

  useEffect(() => {
    if (!canUseBackend || !user?.token) return;

    setLoading(true);
    fetchQuestionsByContent(contentId, apiSubjectId, user.token)
      .then((response) => setRemoteQuestions(response.data))
      .catch((err) => alert(err?.response?.data?.message || 'Failed to load questions'))
      .finally(() => setLoading(false));
  }, [apiSubjectId, canUseBackend, contentId, user?.token]);

  async function submitQuestion() {
    const text = question.trim();
    if (!text) return;

    if (!canUseBackend || !user?.token || !Number.isInteger(apiGroupId)) {
      addQuestion(subjectId, text, user?.name || 'You');
      setQuestion('');
      return;
    }

    try {
      const response = await createQuestion({
        content_id: contentId,
        group_id: apiGroupId,
        subject_id: apiSubjectId,
        question: text,
      }, user.token);

      setRemoteQuestions((prev) => [{
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
    <div className={`qa-page ${theme}`}>
      <div className="qa-list">
        {loading && <div className="empty">Loading questions...</div>}
        {!loading && list.length === 0 && <div className="empty">No questions yet.</div>}
        {list.map((item) => (
          <div key={item.id} className="qa-card">
            <p className="qa-q">Q: {item.question}</p>
            <p className="qa-by">- {item.askedBy}</p>
            {item.answers.map((a, i) => (
              <div key={i} className={`answer-box ${isSchool ? 'green-answer' : ''}`}>
                <p className="answer-text">A: {a.text}</p>
                <p className="answer-by">- {a.by}</p>
              </div>
            ))}
            {canAnswer && (
              <div className="reply-row">
                <input className="input" placeholder={`${t.answer}...`}
                  value={replyMap[item.id] || ''}
                  onChange={(e) => setReplyMap((p) => ({ ...p, [item.id]: e.target.value }))} />
                <button className={`reply-btn ${theme}`}
                  onClick={() => {
                    const v = replyMap[item.id];
                    if (!v?.trim()) return;
                    addAnswer(item.id, v.trim(), user?.name || 'Teacher');
                    setReplyMap((p) => ({ ...p, [item.id]: '' }));
                  }}>{t.send}</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="ask-bar">
        <input className="input" placeholder={t.typeQuestion}
          value={question} onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitQuestion();
          }} />
        <button className={`ask-btn ${theme}`} onClick={submitQuestion}>{t.send}</button>
      </div>
    </div>
  );
}
