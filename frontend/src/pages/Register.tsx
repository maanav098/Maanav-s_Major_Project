import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('candidate');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(email, password, fullName, role);
      navigate('/dashboard');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-start justify-center pt-20 pb-16 px-6">
      <div className="w-full max-w-md fade-rise">
        <p className="eyebrow">Open an account</p>
        <h1
          className="heading-display-italic mt-3"
          style={{ fontSize: 'clamp(2.4rem, 4.6vw, 3.2rem)' }}
        >
          Get&nbsp;started.
        </h1>
        <p className="mt-3 text-ink-muted" style={{ fontSize: '15px' }}>
          A few details and we'll set you up.
        </p>

        <hr className="rule" style={{ margin: '2rem 0 1.5rem' }} />

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

        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <label htmlFor="fullName" className="eyebrow block mb-2">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field"
              placeholder="Jane Doe"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="email" className="eyebrow block mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="eyebrow block mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="eyebrow block mb-3">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('candidate')}
                className={role === 'candidate' ? 'pill pill-active' : 'pill'}
                style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '0.85rem 1rem', textAlign: 'left' }}
              >
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Candidate</span>
                <span
                  className="mono"
                  style={{ fontSize: '11px', marginTop: '0.25rem', opacity: 0.75 }}
                >
                  Looking for practice
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole('recruiter')}
                className={role === 'recruiter' ? 'pill pill-active' : 'pill'}
                style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '0.85rem 1rem', textAlign: 'left' }}
              >
                <span style={{ fontSize: '14px', fontWeight: 500 }}>Recruiter</span>
                <span
                  className="mono"
                  style={{ fontSize: '11px', marginTop: '0.25rem', opacity: 0.75 }}
                >
                  Hiring talent
                </span>
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full" style={{ marginTop: '0.5rem' }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <hr className="rule" style={{ margin: '2.5rem 0 1.25rem' }} />

        <p className="text-ink-muted" style={{ fontSize: '14px' }}>
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-accent"
            style={{ borderBottom: '1px solid var(--accent)' }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
