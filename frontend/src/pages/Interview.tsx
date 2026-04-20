import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewApi } from '../services/api';
import type { Interview as InterviewType } from '../types';
import { Send, Clock, CheckCircle, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';

export default function Interview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<InterviewType | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInterview();
  }, [id]);

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
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } catch {
      setError('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
        <h2 className="text-xl font-semibold text-gray-900">Interview not found</h2>
      </div>
    );
  }

  const questions = interview.questions_asked || [];
  const isCompleted = currentQuestionIndex >= questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const progress = (currentQuestionIndex / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-sm text-gray-500">
              {interview.role} {interview.company && `• ${interview.company}`}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-700">
            Question {Math.min(currentQuestionIndex + 1, questions.length)} of {questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg mb-6">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {!isCompleted ? (
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
              <span className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                Take your time
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {currentQuestion?.question}
            </h2>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Answer
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={8}
              className="input-field resize-none"
              placeholder="Type your answer here... Be detailed and explain your thought process."
            />
            <p className="text-xs text-gray-500 mt-2">
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
      ) : (
        <div className="card text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            All Questions Answered!
          </h2>
          <p className="text-gray-600 mb-6">
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
        <h3 className="text-sm font-medium text-gray-700 mb-3">Progress</h3>
        <div className="flex flex-wrap gap-2">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index < currentQuestionIndex
                  ? 'bg-green-100 text-green-700'
                  : index === currentQuestionIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-400'
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
