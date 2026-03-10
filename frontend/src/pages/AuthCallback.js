import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    const token = params.get('token');
    const error = params.get('error');

    if (error || !token) {
      navigate('/login?error=google_failed', { replace: true });
      return;
    }

    loginWithToken(token)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => navigate('/login?error=token_invalid', { replace: true }));
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'var(--white)' }}>
      <div className="spinner" />
      <p style={{ fontSize: 14, color: 'var(--ink-muted)', fontWeight: 500 }}>Signing you in with Google…</p>
    </div>
  );
}
