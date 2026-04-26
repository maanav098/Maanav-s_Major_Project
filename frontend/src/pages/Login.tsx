import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-start justify-center pt-20 pb-16 px-6">
      <div className="w-full max-w-md fade-rise">
        <p className="eyebrow">Member access</p>
        <h1
          className="heading-display-italic mt-3"
          style={{ fontSize: 'clamp(2.4rem, 4.6vw, 3.2rem)' }}
        >
          Sign in.
        </h1>
        <p className="mt-3 text-ink-muted" style={{ fontSize: '15px' }}>
          Pick up where you left off.
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full" style={{ marginTop: '0.5rem' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <hr className="rule" style={{ margin: '2.5rem 0 1.25rem' }} />

        <p className="text-ink-muted" style={{ fontSize: '14px' }}>
          New here?{' '}
          <Link
            to="/register"
            className="text-accent"
            style={{ borderBottom: '1px solid var(--accent)' }}
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
