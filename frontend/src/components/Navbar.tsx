import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  const linkClass = (path: string) => {
    const active = location.pathname === path || location.pathname.startsWith(path + '/');
    return active ? 'nav-link nav-link-active' : 'nav-link';
  };

  return (
    <nav
      className="surface"
      style={{ borderBottom: '1px solid var(--rule)' }}
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-10">
            <Link
              to="/"
              className="serif-italic text-ink"
              style={{ fontSize: '22px', letterSpacing: '-0.01em' }}
            >
              Interview&thinsp;<span style={{ color: 'var(--accent)' }}>&amp;</span>&thinsp;Co.
            </Link>
            {user && (
              <div className="hidden md:flex items-center gap-7">
                <Link to="/dashboard" className={linkClass('/dashboard')}>
                  Dashboard
                </Link>
                {user.role === 'candidate' && (
                  <>
                    <Link to="/openings" className={linkClass('/openings')}>
                      Openings
                    </Link>
                    <Link to="/interview/new" className={linkClass('/interview/new')}>
                      Practice
                    </Link>
                    <Link to="/my-interviews" className={linkClass('/my-interviews')}>
                      Interviews
                    </Link>
                  </>
                )}
                {user.role === 'recruiter' && (
                  <>
                    <Link to="/jobs" className={linkClass('/jobs')}>
                      Postings
                    </Link>
                    <Link to="/candidates" className={linkClass('/candidates')}>
                      Candidates
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-7">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="eyebrow"
              style={{ background: 'transparent', border: 0, cursor: 'pointer' }}
            >
              {theme === 'light' ? 'Dark' : 'Light'}
            </button>
            {user ? (
              <>
                <div className="hidden sm:flex flex-col items-end leading-tight">
                  <span className="text-ink" style={{ fontSize: '14px' }}>
                    {user.full_name}
                  </span>
                  <span className="eyebrow" style={{ fontSize: '10px', letterSpacing: '0.16em' }}>
                    {user.role}
                  </span>
                </div>
                <button onClick={handleLogout} className="btn-text">
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
