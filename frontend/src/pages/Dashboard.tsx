import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Play, History, FileText, Users, Briefcase, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === 'candidate') {
    return <CandidateDashboard />;
  }

  return <RecruiterDashboard />;
}

function CandidateDashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.full_name}!</h1>
        <p className="text-gray-600 mt-2">Ready to ace your next interview?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Interviews</p>
              <p className="text-3xl font-bold mt-1">0</p>
            </div>
            <History className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Average Score</p>
              <p className="text-3xl font-bold mt-1">-</p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Skills Tracked</p>
              <p className="text-3xl font-bold mt-1">0</p>
            </div>
            <FileText className="h-12 w-12 text-purple-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/interview/new"
              className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Play className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Start New Interview</p>
                <p className="text-sm text-gray-600">Practice with AI-powered questions</p>
              </div>
            </Link>

            <Link
              to="/my-interviews"
              className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <History className="h-6 w-6 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">View Past Interviews</p>
                <p className="text-sm text-gray-600">Review your performance and feedback</p>
              </div>
            </Link>

            <Link
              to="/profile"
              className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FileText className="h-6 w-6 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Update Profile</p>
                <p className="text-sm text-gray-600">Upload resume and update skills</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Roles</h2>
          <div className="space-y-2">
            {['Software Development Engineer', 'ML Engineer', 'Data Scientist', 'Frontend Developer', 'Backend Developer'].map((role) => (
              <Link
                key={role}
                to={`/interview/new?role=${encodeURIComponent(role)}`}
                className="block p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <p className="font-medium text-gray-900">{role}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecruiterDashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.full_name}!</h1>
        <p className="text-gray-600 mt-2">Manage your job postings and candidates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Active Jobs</p>
              <p className="text-3xl font-bold mt-1">0</p>
            </div>
            <Briefcase className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Total Candidates</p>
              <p className="text-3xl font-bold mt-1">0</p>
            </div>
            <Users className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Interviews Completed</p>
              <p className="text-3xl font-bold mt-1">0</p>
            </div>
            <History className="h-12 w-12 text-purple-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/jobs/new"
              className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Briefcase className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Post New Job</p>
                <p className="text-sm text-gray-600">Create a new job listing</p>
              </div>
            </Link>

            <Link
              to="/jobs"
              className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FileText className="h-6 w-6 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Manage Jobs</p>
                <p className="text-sm text-gray-600">View and edit your job postings</p>
              </div>
            </Link>

            <Link
              to="/candidates"
              className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Users className="h-6 w-6 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">View Candidates</p>
                <p className="text-sm text-gray-600">Review and rank applicants</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No recent activity</p>
            <p className="text-sm">Post a job to get started</p>
          </div>
        </div>
      </div>
    </div>
  );
}
