import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function Login() {
  const [role, setRole] = useState<'candidate' | 'recruiter'>('candidate');

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-start justify-center pt-20 pb-16 px-6">
      <div className="w-full max-w-md fade-rise">
        <p className="eyebrow">Sign in</p>
        <h1
          className="heading-display-italic mt-3"
          style={{ fontSize: 'clamp(2.4rem, 4.6vw, 3.2rem)' }}
        >
          Welcome.
        </h1>
        <p className="mt-3 text-ink-muted" style={{ fontSize: '15px' }}>
          Sign-in and sign-up are handled by WorkOS.
        </p>

        <hr className="rule" style={{ margin: '2rem 0 1.5rem' }} />

        <p className="eyebrow mb-3">First time? Choose your role</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('candidate')}
            className={role === 'candidate' ? 'pill pill-active' : 'pill'}
            style={{
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '0.85rem 1rem',
              textAlign: 'left',
            }}
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
            style={{
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '0.85rem 1rem',
              textAlign: 'left',
            }}
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
        <p className="text-ink-faint mt-3" style={{ fontSize: '12px' }}>
          Only used the first time you sign in. Returning users keep their existing role.
        </p>

        <a
          href={`${API_URL}/auth/workos/login?role=${role}`}
          className="btn-primary w-full mt-8"
          style={{ display: 'flex', textDecoration: 'none' }}
        >
          Continue with WorkOS
        </a>
      </div>
    </div>
  );
}
