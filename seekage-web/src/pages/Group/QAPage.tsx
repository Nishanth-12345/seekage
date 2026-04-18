import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth, T } from '../../utils/AuthContext';
import { useData } from '../../utils/DataContext';

export default function QAPage() {
  const { groupId = '', subjectId = '' } = useParams();
  const decoded = decodeURIComponent(groupId);
  const { user, lang } = useAuth();
  const { groups, qa, addQuestion, addAnswer } = useData();
  const t = T[lang];
  const group = groups.find((g) => g.groupId === decoded);
  const isSchool = group?.portal === 'school';
  const theme = isSchool ? 'green' : '';
  const canAnswer = user && (user.role === 'admin' || user.role === 'teacher' || user.role === 'counselor');

  const [question, setQuestion] = useState('');
  const [replyMap, setReplyMap] = useState<Record<number, string>>({});
  const list = qa.filter((q) => q.subjectId === subjectId);

  return (
    <div className={`qa-page ${theme}`}>
      <div className="qa-list">
        {list.length === 0 && <div className="empty">Be the first to ask!</div>}
        {list.map((item) => (
          <div key={item.id} className="qa-card">
            <p className="qa-q">Q: {item.question}</p>
            <p className="qa-by">— {item.askedBy}</p>
            {item.answers.map((a, i) => (
              <div key={i} className={`answer-box ${isSchool ? 'green-answer' : ''}`}>
                <p className="answer-text">A: {a.text}</p>
                <p className="answer-by">— {a.by}</p>
              </div>
            ))}
            {canAnswer && (
              <div className="reply-row">
                <input className="input" placeholder={t.answer + '…'}
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
            if (e.key === 'Enter' && question.trim()) {
              addQuestion(subjectId, question.trim(), user?.name || 'You');
              setQuestion('');
            }
          }} />
        <button className={`ask-btn ${theme}`}
          onClick={() => {
            if (!question.trim()) return;
            addQuestion(subjectId, question.trim(), user?.name || 'You');
            setQuestion('');
          }}>{t.send}</button>
      </div>
    </div>
  );
}
