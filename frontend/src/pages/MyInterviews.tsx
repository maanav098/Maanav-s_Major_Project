import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { interviewApi } from '../services/api';
import type { Interview } from '../types';
import { Calendar, Clock, TrendingUp, ChevronRight, Loader2, FileText } from 'lucide-react';

export default function MyInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      const data = await interviewApi.myInterviews();
      setInterviews(data);
    } catch (error) {
      console.error('Failed to load interviews', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'evaluated':
        return <span className="badge badge-success">Completed</span>;
      case 'completed':
        return <span className="badge badge-info">Evaluating</span>;
      case 'in_progress':
        return <span className="badge badge-warning">In Progress</span>;
      default:
        return <span className="badge">Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Interviews</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Track your interview practice history</p>
        </div>
        <Link to="/interview/new" className="btn-primary">
          Start New Interview
        </Link>
      </div>

      {interviews.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No interviews yet</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Start practicing to see your history here</p>
          <Link to="/interview/new" className="btn-primary inline-block">
            Start Your First Interview
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => (
            <Link
              key={interview.id}
              to={interview.status === 'evaluated'
                ? `/interview/${interview.id}/result`
                : `/interview/${interview.id}`}
              className="card block hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {interview.role}
                    </h3>
                    {interview.company && (
                      <span className="text-gray-500 dark:text-gray-400">• {interview.company}</span>
                    )}
                    {getStatusBadge(interview.status)}
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(interview.created_at).toLocaleDateString()}
                    </span>
                    {interview.started_at && (
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(interview.started_at).toLocaleTimeString()}
                      </span>
                    )}
                    <span>{interview.questions_asked?.length || 0} questions</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {interview.overall_score && (
                    <div className="text-right">
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <TrendingUp className="h-5 w-5 mr-1" />
                        <span className="text-2xl font-bold">{interview.overall_score}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Overall Score</span>
                    </div>
                  )}
                  <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-600" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
