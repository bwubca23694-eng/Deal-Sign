import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API     = process.env.REACT_APP_API_URL || '/api';
const BACKEND = (process.env.REACT_APP_API_URL || '/api').replace('/api', '');

export default function Login() {
  const { login } = useAuth();
  const [email,   setEmail]   = useState('');
  const [pass,    setPass]    = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const urlErr = new URLSearchParams(window.location.search).get('error');

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password: pass });
      login(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-topbar">
          <div className="logo">
            <div className="logo-mark">D</div>
            <span className="logo-text">DealFlow</span>
          </div>
        </div>

        <div className="auth-form">
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.03em' }}>Welcome back</h1>
            <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginTop: 6 }}>Sign in to manage your deals and proposals.</p>
          </div>

          {(error || urlErr) && (
            <div className="alert alert-error">
              {urlErr === 'google_failed' ? 'Google sign-in failed. Please try again.' : error}
            </div>
          )}

          <button className="btn btn-google" onClick={() => { window.location.href = `${BACKEND}/api/auth/google`; }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="divider-text">or continue with email</div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Password</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Your password" required autoComplete="current-password" />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--ink-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--green)', fontWeight: 700 }}>Create one free</Link>
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div style={{ maxWidth: 380 }}>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 22, fontStyle: 'italic', color: 'rgba(255,255,255,.85)', lineHeight: 1.7, marginBottom: 28 }}>
            "I used to spend days chasing clients for signatures and payments. DealFlow cut that down to hours."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,.15)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>PJ</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Priya Joshi</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 }}>Freelance UI/UX Designer, Pune</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
