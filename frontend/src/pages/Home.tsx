import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase, Users, Brain, Target,
  ArrowRight, Sparkles, Building2, TrendingUp
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="bg-white dark:bg-gray-900 transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              AI-Powered
              <span className="text-blue-600 dark:text-blue-400"> Interview</span>
              <br />Preparation Platform
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Transform your recruitment journey with AI-driven interview practice,
              personalized feedback, and intelligent candidate screening.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link to="/dashboard" className="btn-primary text-lg px-8 py-3 flex items-center">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary text-lg px-8 py-3 flex items-center">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link to="/login" className="btn-outline text-lg px-8 py-3">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-5 dark:opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Whether you're a candidate preparing for interviews or a recruiter screening talent,
              our platform has you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">AI-Powered Evaluation</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get instant, detailed feedback on your answers with technical and communication scores.
              </p>
            </div>

            <div className="card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Company-Specific Practice</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Practice with questions tailored to Amazon, Google, Microsoft, and more top companies.
              </p>
            </div>

            <div className="card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Level Prediction</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Understand your readiness level - from Entry to Senior - with our AI assessment.
              </p>
            </div>

            <div className="card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Personalized Feedback</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Receive actionable suggestions to improve your interview performance.
              </p>
            </div>

            <div className="card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Recruiter Dashboard</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Screen candidates efficiently with resume matching and interview rankings.
              </p>
            </div>

            <div className="card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Progress Tracking</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Monitor your improvement over time with detailed performance analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-gray-600 dark:text-gray-300">Get started in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Select Your Role</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Choose your target role (SDE, ML Engineer, etc.) and optionally select a company style.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Practice Interview</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Answer AI-generated questions covering technical, behavioral, and coding topics.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Get Feedback</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Receive detailed scores, strengths, weaknesses, and improvement suggestions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join thousands of candidates who have improved their interview skills with our platform.
          </p>
          {!user && (
            <Link
              to="/register"
              className="inline-flex items-center bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Start Practicing Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Briefcase className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold text-white">InterviewAI</span>
            </div>
            <p className="text-sm">
              © 2024 InterviewAI. Built for Major Project.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
