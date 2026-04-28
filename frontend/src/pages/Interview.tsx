import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewApi } from '../services/api';
import type { Interview as InterviewType } from '../types';
import { CheckCircle, ChevronRight, Loader2, Timer, AlertTriangle } from 'lucide-react';
import VoiceRecorder from '../components/VoiceRecorder';
import CodeEditor, { LANGUAGES } from '../components/CodeEditor';

export default function Interview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<InterviewType | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [code, setCode] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('python');
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timerExpired, setTimerExpired] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const DEFAULT_TIME_MINUTES = 5;

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getTimerColor = useCallback((seconds: number): string => {
    if (seconds <= 30) return 'text-accent';
    if (seconds <= 60) return 'text-ink';
    return 'text-ink-muted';
  }, []);

  useEffect(() => {
    loadInterview();
  }, [id]);

  useEffect(() => {
    if (!interview || currentQuestionIndex >= (interview.questions_asked?.length || 0)) {
      return;
    }

    const currentQuestion = interview.questions_asked[currentQuestionIndex];
    const timeLimitMinutes = currentQuestion?.time_limit_minutes || DEFAULT_TIME_MINUTES;
    setTimeRemaining(timeLimitMinutes * 60);
    setTimerExpired(false);

    if (currentQuestion?.type === 'coding') {
      const lang = LANGUAGES.find(l => l.id === codeLanguage) || LANGUAGES[0];
      setCode(lang.starter);
    } else {
      setCode('');
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimerExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [interview, currentQuestionIndex]);

  const loadInterview = async () => {
    try {
      const data = await interviewApi.get(Number(id));
      setInterview(data);
      setCurrentQuestionIndex(data.responses?.length || 0);
    } catch {
      setError('Failed to load interview');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!interview) return;
    const currentQuestion = interview.questions_asked[currentQuestionIndex];
    const isCoding = currentQuestion?.type === 'coding';

    const submission = isCoding
      ? (() => {
          const lang = LANGUAGES.find(l => l.id === codeLanguage) || LANGUAGES[0];
          return code.trim() ? `[Language: ${lang.label}]\n\n${code}` : '';
        })()
      : answer.trim();

    if (!submission) return;

    setSubmitting(true);
    setError('');

    try {
      const updated = await interviewApi.submitAnswer(interview.id, {
        question_id: currentQuestion.id,
        answer: submission,
      });
      setInterview(updated);
      setAnswer('');
      setCode('');

      const latestResp = updated.responses[updated.responses.length - 1];
      if (latestResp?.follow_up_question && !latestResp.follow_up_answer) {
        // Stay on the same question index — follow-up UI will render.
        return;
      }
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } catch {
      setError('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFollowUp = async () => {
    if (!followUpAnswer.trim() || !interview) return;

    setSubmittingFollowUp(true);
    setError('');

    try {
      const currentQuestion = interview.questions_asked[currentQuestionIndex];
      const updated = await interviewApi.submitFollowUp(interview.id, {
        question_id: currentQuestion.id,
        follow_up_answer: followUpAnswer.trim(),
      });
      setInterview(updated);
      setFollowUpAnswer('');
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } catch {
      setError('Failed to submit follow-up. Please try again.');
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  const handleSkipFollowUp = () => {
    setFollowUpAnswer('');
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

  const handleCompleteInterview = async () => {
    if (!interview) return;

    setCompleting(true);
    try {
      const result = await interviewApi.complete(interview.id);
      setInterview(result);
      navigate(`/interview/${interview.id}/result`);
    } catch {
      setError('Failed to complete interview');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="serif-italic text-ink" style={{ fontSize: '22px' }}>
          Interview not found.
        </p>
      </div>
    );
  }

  const questions = interview.questions_asked || [];
  const isCompleted = currentQuestionIndex >= questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const progress = (currentQuestionIndex / questions.length) * 100;
  const currentResponse = interview.responses?.[currentQuestionIndex];
  const pendingFollowUp = Boolean(
    currentResponse?.follow_up_question && !currentResponse?.follow_up_answer
  );

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="eyebrow">
            {interview.role}{interview.company ? ` · ${interview.company}` : ''}
          </p>
          <p className="mono text-ink-muted" style={{ fontSize: '12px' }}>
            {String(Math.min(currentQuestionIndex + 1, questions.length)).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
          </p>
        </div>
        <div style={{ height: '1px', width: '100%', background: 'var(--rule)', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '1px',
              background: 'var(--ink)',
              width: `${progress}%`,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {error && (
        <p
          className="mb-6"
          style={{
            color: 'var(--accent)',
            fontSize: '13px',
            borderLeft: '2px solid var(--accent)',
            paddingLeft: '0.75rem',
          }}
        >
          {error}
        </p>
      )}

      {timerExpired && !isCompleted && (
        <p
          className="mb-6 flex items-center gap-2 text-accent"
          style={{
            fontSize: '13px',
            borderLeft: '2px solid var(--accent)',
            paddingLeft: '0.75rem',
          }}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Time's up — you can still submit, but try to wrap up.</span>
        </p>
      )}

      {!isCompleted ? (
        pendingFollowUp ? (
          <div className="card" style={{ borderTop: '1px solid var(--accent)' }}>
            <div className="mb-5">
              <p className="eyebrow text-accent">Deep-dive follow-up</p>
              <p className="mt-3 text-ink-muted" style={{ fontSize: '13px' }}>
                Your previous answer warranted a closer look:
              </p>
              <h2 className="serif mt-3" style={{ fontSize: '20px', lineHeight: 1.35 }}>
                {currentResponse?.follow_up_question}
              </h2>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <label className="eyebrow">Your follow-up answer</label>
                <VoiceRecorder
                  disabled={submittingFollowUp}
                  onTranscript={(t) => setFollowUpAnswer((prev) => (prev ? prev + ' ' + t : t))}
                />
              </div>
              <textarea
                value={followUpAnswer}
                onChange={(e) => setFollowUpAnswer(e.target.value)}
                rows={5}
                className="input-field-boxed"
                placeholder="Elaborate briefly — a strong follow-up answer is specific."
              />
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleSkipFollowUp}
                className="btn-secondary"
                disabled={submittingFollowUp}
              >
                Skip
              </button>
              <button
                onClick={handleSubmitFollowUp}
                disabled={!followUpAnswer.trim() || submittingFollowUp}
                className="btn-primary"
              >
                {submittingFollowUp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Submit &amp; continue</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
        <div className="card">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-5">
              <span className={`badge ${
                currentQuestion?.type === 'technical' ? 'badge-info' :
                currentQuestion?.type === 'behavioral' ? 'badge-success' :
                currentQuestion?.type === 'coding' ? 'badge-warning' :
                'badge-info'
              }`}>
                {currentQuestion?.type}
              </span>
              <span className={`mono flex items-center gap-1.5 ${getTimerColor(timeRemaining)}`} style={{ fontSize: '13px' }}>
                <Timer className={`h-3.5 w-3.5 ${timeRemaining <= 30 ? 'animate-pulse' : ''}`} />
                {formatTime(timeRemaining)}
              </span>
            </div>
            <h2 className="serif" style={{ fontSize: '21px', lineHeight: 1.35, color: 'var(--ink)' }}>
              {currentQuestion?.question}
            </h2>
            {currentQuestion?.source_domain && (
              <p
                className="eyebrow mt-4 flex items-center gap-2"
                style={{ fontSize: '10px' }}
              >
                <span>As reported on</span>
                {currentQuestion.source_url ? (
                  <a
                    href={currentQuestion.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent"
                    style={{
                      textDecoration: 'none',
                      borderBottom: '1px solid var(--accent)',
                      paddingBottom: '1px',
                    }}
                  >
                    {currentQuestion.source_domain}
                  </a>
                ) : (
                  <span className="text-accent">{currentQuestion.source_domain}</span>
                )}
              </p>
            )}
          </div>

          {currentQuestion?.type === 'coding' ? (
            <>
              <div className="mb-6">
                <CodeEditor
                  key={`q-${currentQuestion?.id ?? currentQuestionIndex}`}
                  languageId={codeLanguage}
                  onLanguageChange={setCodeLanguage}
                  code={code}
                  onCodeChange={setCode}
                  disabled={submitting}
                />
                <p className="text-ink-faint mt-2" style={{ fontSize: '12px' }}>
                  Tip: test with "Run Code" before submitting. Think out loud with comments.
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => {
                    const lang = LANGUAGES.find(l => l.id === codeLanguage) || LANGUAGES[0];
                    setCode(lang.starter);
                  }}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Reset
                </button>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!code.trim() || submitting}
                  className="btn-primary"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Submit solution</span>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="eyebrow">Your answer</label>
                  <VoiceRecorder
                    disabled={submitting}
                    onTranscript={(t) => setAnswer((prev) => (prev ? prev + ' ' + t : t))}
                  />
                </div>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={8}
                  className="input-field-boxed"
                  placeholder="Type your answer, or click 'Record' to speak it."
                />
                <p className="text-ink-faint mt-2" style={{ fontSize: '12px' }}>
                  Structure your answer clearly. For behavioural questions, the STAR method works well.
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setAnswer('')}
                  className="btn-secondary"
                  disabled={!answer}
                >
                  Clear
                </button>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!answer.trim() || submitting}
                  className="btn-primary"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Submit answer</span>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
        )
      ) : (
        <div className="card text-center" style={{ padding: '3rem 2rem' }}>
          <p className="eyebrow">Round complete</p>
          <h2 className="heading-display-italic mt-4" style={{ fontSize: '32px' }}>
            All answered.
          </h2>
          <p className="mt-3 text-ink-muted max-w-md mx-auto" style={{ fontSize: '14px' }}>
            You've worked through all {questions.length} questions. Submit for evaluation when you're ready.
          </p>
          <button
            onClick={handleCompleteInterview}
            disabled={completing}
            className="btn-primary mt-8"
          >
            {completing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Evaluating…</span>
              </>
            ) : (
              <>
                <span>See my results</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}

      <div className="mt-10">
        <p className="eyebrow mb-4">Progress</p>
        <div className="flex flex-wrap gap-2">
          {questions.map((_, index) => {
            const done = index < currentQuestionIndex;
            const current = index === currentQuestionIndex;
            const style: React.CSSProperties = {
              width: '28px',
              height: '28px',
              borderRadius: '2px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontFamily: 'var(--mono)',
              border: '1px solid var(--rule)',
              color: 'var(--ink-faint)',
              background: 'transparent',
            };
            if (done) {
              style.background = 'var(--ink)';
              style.color = 'var(--surface)';
              style.borderColor = 'var(--ink)';
            } else if (current) {
              style.borderColor = 'var(--ink)';
              style.color = 'var(--ink)';
            }
            return (
              <div key={index} style={style}>
                {done ? <CheckCircle className="h-3.5 w-3.5" /> : index + 1}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
