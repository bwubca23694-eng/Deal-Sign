import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleButton from '../components/GoogleButton';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    if (params.get('error') === 'google_failed') setError('Google sign-in failed. Please try again.');
  }, [params]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.left}>
        <Link to="/" style={s.logo}>
          <div style={s.logoMark}>D</div>
          <span style={s.logoText}>DealFlow</span>
        </Link>
        <div style={s.leftContent}>
          <h1 style={s.headline}>Welcome back</h1>
          <p style={s.sub}>Sign in to manage your deals and proposals.</p>
          {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}
          <GoogleButton label="Continue with Google" />
          <div className="divider-text">or continue with email</div>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
            </div>
            <div className="field" style={{ marginBottom: 24 }}>
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" required />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>
          <p style={s.switchText}>
            Don't have an account? <Link to="/register" style={s.switchLink}>Create one free</Link>
          </p>
        </div>
      </div>
      <div style={s.right}>
        <div style={s.rightContent}>
          <div style={s.quote}>"I used to spend days chasing clients for signatures and payments. DealFlow cut that down to hours."</div>
          <div style={s.quoteAuthor}>
            <div style={s.quoteAvatar}>PJ</div>
            <div>
              <div style={s.quoteName}>Priya Joshi</div>
              <div style={s.quoteRole}>Freelance UI/UX Designer, Pune</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', background: 'var(--white)' },
  left: { flex: '0 0 480px', display: 'flex', flexDirection: 'column', padding: '32px 48px', borderRight: '1px solid var(--border)' },
  logo: { display: 'flex', alignItems: 'center', gap: 9, marginBottom: 48 },
  logoMark: { width: 30, height: 30, background: 'var(--ink)', color: 'var(--white)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 },
  logoText: { fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em', color: 'var(--ink)' },
  leftContent: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 360, margin: '0 auto', width: '100%' },
  headline: { fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--ink)', marginBottom: 8 },
  sub: { color: 'var(--ink-muted)', fontSize: 14.5, marginBottom: 28 },
  switchText: { textAlign: 'center', fontSize: 13.5, color: 'var(--ink-muted)', marginTop: 24 },
  switchLink: { color: 'var(--teal-500)', fontWeight: 600 },
  right: { flex: 1, background: 'var(--gray-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' },
  rightContent: { maxWidth: 400 },
  quote: { fontSize: 20, fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'rgba(255,255,255,0.9)', lineHeight: 1.7, marginBottom: 28 },
  quoteAuthor: { display: 'flex', alignItems: 'center', gap: 12 },
  quoteAvatar: { width: 42, height: 42, background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 },
  quoteName: { fontSize: 14, fontWeight: 700, color: '#fff' },
  quoteRole: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
};
