import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewApi } from '../services/api';
import type { Interview as InterviewType } from '../types';
import { Send, Clock, CheckCircle, AlertCircle, ChevronRight, Loader2, Timer, AlertTriangle, Sparkles } from 'lucide-react';
import VoiceRecorder from '../components/VoiceRecorder';

export default function Interview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<InterviewType | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
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
    if (seconds <= 30) return 'text-red-600 dark:text-red-400';
    if (seconds <= 60) return 'text-orange-500 dark:text-orange-400';
    return 'text-gray-600 dark:text-gray-400';
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
    if (!answer.trim() || !interview) return;

    setSubmitting(true);
    setError('');

    try {
      const currentQuestion = interview.questions_asked[currentQuestionIndex];
      const updated = await interviewApi.submitAnswer(interview.id, {
        question_id: currentQuestion.id,
        answer: answer.trim(),
      });
      setInterview(updated);
      setAnswer('');

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Interview not found</h2>
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-sm text-gray-500">
              {interview.role} {interview.company && `• ${interview.company}`}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Question {Math.min(currentQuestionIndex + 1, questions.length)} of {questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 dark:bg-red-900/30 p-3 rounded-lg mb-6">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {timerExpired && !isCompleted && (
        <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 p-3 rounded-lg mb-6 animate-pulse">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm font-medium">Time's up! You can still submit your answer, but try to wrap up.</span>
        </div>
      )}

      {!isCompleted ? (
        pendingFollowUp ? (
          <div className="card border-2 border-purple-200 dark:border-purple-800">
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                  Deep-dive follow-up
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Based on your previous answer, the interviewer wants to dig deeper:
              </p>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentResponse?.follow_up_question}
              </h2>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Your Follow-up Answer
                </label>
                <VoiceRecorder
                  disabled={submittingFollowUp}
                  onTranscript={(t) => setFollowUpAnswer((prev) => (prev ? prev + ' ' + t : t))}
                />
              </div>
              <textarea
                value={followUpAnswer}
                onChange={(e) => setFollowUpAnswer(e.target.value)}
                rows={5}
                className="input-field resize-none"
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
                className="btn-primary flex items-center space-x-2"
              >
                {submittingFollowUp ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>Submit & Continue</span>
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
        <div className="card">
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className={`badge ${
                currentQuestion?.type === 'technical' ? 'badge-info' :
                currentQuestion?.type === 'behavioral' ? 'badge-success' :
                currentQuestion?.type === 'coding' ? 'badge-warning' :
                'badge-info'
              }`}>
                {currentQuestion?.type}
              </span>
              <span className={`flex items-center text-sm font-medium ${getTimerColor(timeRemaining)}`}>
                <Timer className={`h-4 w-4 mr-1 ${timeRemaining <= 30 ? 'animate-pulse' : ''}`} />
                {formatTime(timeRemaining)}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentQuestion?.question}
            </h2>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Your Answer
              </label>
              <VoiceRecorder
                disabled={submitting}
                onTranscript={(t) => setAnswer((prev) => (prev ? prev + ' ' + t : t))}
              />
            </div>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={8}
              className="input-field resize-none"
              placeholder="Type your answer, or click 'Record answer' to speak it."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Tip: Structure your answer clearly. For behavioral questions, use the STAR method.
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
              className="btn-primary flex items-center space-x-2"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Submit Answer</span>
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>
        )
      ) : (
        <div className="card text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            All Questions Answered!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You've answered all {questions.length} questions. Click below to get your evaluation and feedback.
          </p>
          <button
            onClick={handleCompleteInterview}
            disabled={completing}
            className="btn-primary flex items-center justify-center space-x-2 mx-auto"
          >
            {completing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <span>Get My Results</span>
                <ChevronRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Progress</h3>
        <div className="flex flex-wrap gap-2">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index < currentQuestionIndex
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                  : index === currentQuestionIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              }`}
            >
              {index < currentQuestionIndex ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
