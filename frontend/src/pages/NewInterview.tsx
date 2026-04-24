import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { interviewApi } from '../services/api';
import { Play, Building2, Briefcase, AlertCircle, Hash } from 'lucide-react';

const QUESTION_COUNTS = [5, 10, 15, 20];

const ROLES = [
  'SDE',
  'ML Engineer',
  'Data Scientist',
  'Frontend Developer',
  'Backend Developer',
  'DevOps Engineer',
  'Product Manager'
];

const COMPANIES = [
  'Amazon',
  'Google',
  'Microsoft',
  'Meta',
  'Apple',
  'Netflix',
  'Startup'
];

export default function NewInterview() {
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState(searchParams.get('role') || '');
  const [company, setCompany] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleStartInterview = async () => {
    if (!role) {
      setError('Please select a role');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const interview = await interviewApi.start({ role, company: company || undefined, num_questions: numQuestions });
      navigate(`/interview/${interview.id}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start interview. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Start Practice Interview</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Select your target role and company to begin</p>
      </div>

      <div className="card">
        {error && (
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-3 rounded-lg mb-6">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span>Select Target Role *</span>
              </div>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    role === r
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-500'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:text-gray-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span>Select Company Style (Optional)</span>
              </div>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {COMPANIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCompany(company === c ? '' : c)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    company === c
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-500'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:text-gray-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Company selection adjusts question style and difficulty
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <div className="flex items-center space-x-2">
                <Hash className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span>Number of Questions</span>
              </div>
            </label>
            <div className="grid grid-cols-4 gap-3">
              {QUESTION_COUNTS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setNumQuestions(count)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    numQuestions === count
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-500'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:text-gray-200'
                  }`}
                >
                  {count} Questions
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Interview Details</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• {numQuestions} questions tailored to your role{company ? ` and ${company} style` : ''}</li>
              <li>• Mix of technical, behavioral, and coding questions</li>
              <li>• AI-powered evaluation and feedback</li>
              <li>• Estimated time: {Math.round(numQuestions * 3)}-{Math.round(numQuestions * 5)} minutes</li>
            </ul>
          </div>

          <button
            onClick={handleStartInterview}
            disabled={loading || !role}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            <Play className="h-5 w-5" />
            <span>{loading ? 'Starting...' : 'Start Interview'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
