import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';

function decodeUrlSafeBase64(input: string): string {
  const padded = input + '='.repeat((4 - (input.length % 4)) % 4);
  return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
}

export default function WorkosCallback() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) {
      navigate('/login', { replace: true });
      return;
    }
    const params = new URLSearchParams(hash);

    const errParam = params.get('error');
    if (errParam) {
      try {
        setError(decodeUrlSafeBase64(errParam));
      } catch {
        setError('Sign-in failed.');
      }
      return;
    }

    const token = params.get('token');
    const userB64 = params.get('user');
    if (!token || !userB64) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const userJson = decodeUrlSafeBase64(userB64);
      const user: User = JSON.parse(userJson);
      setSession(token, user);
      // Strip the hash so the token doesn't linger in browser history.
      window.history.replaceState(null, '', window.location.pathname);
      navigate('/dashboard', { replace: true });
    } catch (e) {
      console.error(e);
      setError('Could not read sign-in response.');
    }
  }, [navigate, setSession]);

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="eyebrow text-accent">Sign-in failed</p>
          <p
            className="serif-italic mt-3 text-ink"
            style={{ fontSize: '20px', lineHeight: 1.4 }}
          >
            {error}
          </p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="btn-secondary mt-8"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="spinner" />
    </div>
  );
}
