import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { interviewApi } from '../services/api';
import type { Interview } from '../types';
import {
  Trophy, TrendingUp, MessageSquare, Target,
  CheckCircle, XCircle, Lightbulb, ArrowLeft, Loader2
} from 'lucide-react';

export default function InterviewResult() {
  const { id } = useParams<{ id: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInterview();
  }, [id]);

  const loadInterview = async () => {
    try {
      const data = await interviewApi.get(Number(id));
      setInterview(data);
    } catch {
      console.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!interview || !interview.overall_score) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Results not available</h2>
        <Link to="/dashboard" className="btn-primary mt-4 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return '!bg-green-100 dark:!bg-green-900/40';
    if (score >= 60) return '!bg-yellow-100 dark:!bg-yellow-900/40';
    return '!bg-red-100 dark:!bg-red-900/40';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white mb-6">
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Dashboard
      </Link>

      <div className="text-center mb-8">
        <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Interview Complete!</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          {interview.role} {interview.company && `• ${interview.company}`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`card text-center ${getScoreBg(interview.overall_score)}`}>
          <Target className={`h-8 w-8 mx-auto mb-2 ${getScoreColor(interview.overall_score)}`} />
          <p className="text-sm text-gray-700 dark:text-gray-200">Overall Score</p>
          <p className={`text-4xl font-bold ${getScoreColor(interview.overall_score)}`}>
            {interview.overall_score}
          </p>
        </div>

        <div className={`card text-center ${getScoreBg(interview.technical_score || 0)}`}>
          <TrendingUp className={`h-8 w-8 mx-auto mb-2 ${getScoreColor(interview.technical_score || 0)}`} />
          <p className="text-sm text-gray-700 dark:text-gray-200">Technical Score</p>
          <p className={`text-4xl font-bold ${getScoreColor(interview.technical_score || 0)}`}>
            {interview.technical_score || 0}
          </p>
        </div>

        <div className={`card text-center ${getScoreBg(interview.communication_score || 0)}`}>
          <MessageSquare className={`h-8 w-8 mx-auto mb-2 ${getScoreColor(interview.communication_score || 0)}`} />
          <p className="text-sm text-gray-700 dark:text-gray-200">Communication</p>
          <p className={`text-4xl font-bold ${getScoreColor(interview.communication_score || 0)}`}>
            {interview.communication_score || 0}
          </p>
        </div>
      </div>

      {interview.level_prediction && (
        <div className="card bg-gradient-to-r from-blue-500 to-purple-600 text-white mb-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Level Prediction</h2>
            <p className="text-2xl font-bold">{interview.level_prediction}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            Strengths
          </h2>
          {interview.strengths && interview.strengths.length > 0 ? (
            <ul className="space-y-2">
              {interview.strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-200">{strength}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No specific strengths identified</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-2" />
            Areas for Improvement
          </h2>
          {interview.weaknesses && interview.weaknesses.length > 0 ? (
            <ul className="space-y-2">
              {interview.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start">
                  <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-200">{weakness}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No specific areas identified</p>
          )}
        </div>
      </div>

      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
          Suggestions for Improvement
        </h2>
        {interview.suggestions && interview.suggestions.length > 0 ? (
          <ul className="space-y-3">
            {interview.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg">
                <Lightbulb className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-200">{suggestion}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No specific suggestions</p>
        )}
      </div>

      <div className="flex justify-center space-x-4">
        <Link to="/interview/new" className="btn-primary">
          Practice Again
        </Link>
        <Link to="/my-interviews" className="btn-secondary">
          View All Interviews
        </Link>
      </div>
    </div>
  );
}
