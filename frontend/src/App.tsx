import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewInterview from './pages/NewInterview';
import Interview from './pages/Interview';
import InterviewResult from './pages/InterviewResult';
import MyInterviews from './pages/MyInterviews';
import Jobs from './pages/Jobs';
import JobForm from './pages/JobForm';
import JobDetail from './pages/JobDetail';
import Candidates from './pages/Candidates';
import Openings from './pages/Openings';
import OpeningDetail from './pages/OpeningDetail';
import RecruiterRoute from './components/RecruiterRoute';
import './index.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center surface">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center surface">
        <div className="spinner" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <div className="min-h-screen surface">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview/new"
          element={
            <ProtectedRoute>
              <NewInterview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview/:id"
          element={
            <ProtectedRoute>
              <Interview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview/:id/result"
          element={
            <ProtectedRoute>
              <InterviewResult />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-interviews"
          element={
            <ProtectedRoute>
              <MyInterviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/openings"
          element={
            <ProtectedRoute>
              <Openings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/openings/:id"
          element={
            <ProtectedRoute>
              <OpeningDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <RecruiterRoute>
              <Jobs />
            </RecruiterRoute>
          }
        />
        <Route
          path="/jobs/new"
          element={
            <RecruiterRoute>
              <JobForm />
            </RecruiterRoute>
          }
        />
        <Route
          path="/jobs/:id"
          element={
            <RecruiterRoute>
              <JobDetail />
            </RecruiterRoute>
          }
        />
        <Route
          path="/jobs/:id/edit"
          element={
            <RecruiterRoute>
              <JobForm />
            </RecruiterRoute>
          }
        />
        <Route
          path="/candidates"
          element={
            <RecruiterRoute>
              <Candidates />
            </RecruiterRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
