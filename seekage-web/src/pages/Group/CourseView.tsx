import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth, T } from '../../utils/AuthContext';
import VideoPlayer from '../../components/VideoPlayer';
import PdfViewer from '../../components/PdfViewer';
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

export interface ContentViewLocationState {
    contentId: number;
    title: string;
    fileName: string;
    fileUrl?: string;
    kind: 'video' | 'note' | 'document' | 'assignment';
}

export default function ContentViewPage() {
    const { groupId = '', subjectId = '' } = useParams();
    const decoded = decodeURIComponent(groupId);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, lang } = useAuth();
    const t = T[lang];

    const state = location.state as ContentViewLocationState | null;

    const [question, setQuestion] = useState('');
    const [questions, setQuestions] = useState<ApiQuestion[]>([]);
    const [questionsLoading, setQuestionsLoading] = useState(false);

    useEffect(() => {
        if (!state || !user?.token) return;
        const apiSubjectId = Number(subjectId);
        if (!Number.isInteger(apiSubjectId)) return;

        setQuestionsLoading(true);
        fetchQuestionsByContent(state.contentId, apiSubjectId, user.token)
            .then((response) => setQuestions(response.data))
            .catch((err) => alert(err?.response?.data?.message || 'Failed to load questions'))
            .finally(() => setQuestionsLoading(false));
    }, [state, subjectId, user?.token]);

    if (!state) {
        return (
            <div className="empty">
                Content not found.{' '}
                <button className="cancel-btn" onClick={() => navigate(-1)}>
                    Go back
                </button>
            </div>
        );
    }

    const isVideo = state.kind === 'video';
    const isPdf = state.kind === 'document' || state.kind === 'assignment';

    async function submitQuestion() {
        const text = question.trim();

        // before
        if (!user?.token || !text) return;

        // after
        if (!state || !user?.token || !text) return;
        const apiGroupId = Number(decoded);
        const apiSubjectId = Number(subjectId);

        if (!Number.isInteger(apiGroupId) || !Number.isInteger(apiSubjectId)) {
            alert('This action needs backend content, group, and subject ids.');
            return;
        }

        try {
            const response = await createQuestion(
                {
                    content_id: state.contentId,
                    group_id: apiGroupId,
                    subject_id: apiSubjectId,
                    question: text,
                },
                user.token
            );

            setQuestions((prev) => [
                {
                    question_id: response.data.questionId,
                    content_id: response.data.contentId,
                    group_id: response.data.groupId,
                    subject_id: response.data.subjectId,
                    question_text: text,
                    asked_by_name: user.name,
                    answers: [],
                },
                ...prev,
            ]);
            setQuestion('');
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Failed to post question');
        }
    }

    return (
        <div className="content-view-page">
            {/* Back button */}
            <div className="group-bar">
                <button className="cancel-btn" onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <div className="group-name">{state.title}</div>
            </div>

            {/* Media viewer */}
            <div className="content-view-media">
                {isVideo && (
                    <VideoPlayer
                        contentId={state.contentId}
                        title={state.title}
                        fileName={state.fileName}
                        fileUrl={state.fileUrl}
                        token={user?.token}
                        onClose={() => navigate(-1)}
                    />
                )}
                {isPdf && (
                    <PdfViewer
                        contentId={state.contentId}
                        title={state.title}
                        fileName={state.fileName}
                        fileUrl={state.fileUrl}
                        token={user?.token}
                        onClose={() => navigate(-1)}
                    />
                )}
                {!isVideo && !isPdf && (
                    <div className="empty">Preview not available for this content type.</div>
                )}
            </div>

            {/* Q&A section */}
            <div className="content-view-qa">
                <div className="modal-title">💬 Q&amp;A — {state.title}</div>

                {/* Ask input */}
                <div className="ask-bar">
                    <input
                        className="input"
                        placeholder={t.typeQuestion}
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') submitQuestion();
                        }}
                    />
                    <button className="ask-btn" onClick={submitQuestion}>
                        {t.send}
                    </button>
                </div>

                {/* Questions list */}
                <div className="qa-modal-list">
                    {questionsLoading && <div className="empty">Loading questions...</div>}
                    {!questionsLoading && questions.length === 0 && (
                        <div className="empty">No questions yet. Be the first to ask!</div>
                    )}
                    {!questionsLoading &&
                        questions.map((item) => (
                            <div key={item.question_id} className="qa-card">
                                <p className="qa-q">Q: {item.question_text}</p>
                                <p className="qa-by">— {item.asked_by_name}</p>
                                {normalizeAnswers(item.answers).map((answer, index) => (
                                    <div key={index} className="answer-box">
                                        <p className="answer-text">A: {answer.text}</p>
                                        <p className="answer-by">— {answer.by}</p>
                                    </div>
                                ))}
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}
