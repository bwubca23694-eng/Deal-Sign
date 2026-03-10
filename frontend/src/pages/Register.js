import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleButton from '../components/GoogleButton';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', upiId: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.upiId);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
          <h1 style={s.headline}>Create your account</h1>
          <p style={s.sub}>Join freelancers who close deals faster with DealFlow.</p>
          {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}
          <GoogleButton label="Sign up with Google" />
          <div className="divider-text">or sign up with email</div>
          <form onSubmit={handleSubmit}>
            <div style={s.row}>
              <div className="field" style={{ flex: 1 }}>
                <label>Full name</label>
                <input value={form.name} onChange={set('name')} placeholder="Aditya Kumar" required />
              </div>
            </div>
            <div className="field">
              <label>Email address</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" required minLength={6} />
            </div>
            <div className="field" style={{ marginBottom: 24 }}>
              <label>UPI ID <span className="optional">(can be added later)</span></label>
              <input value={form.upiId} onChange={set('upiId')} placeholder="yourname@upi or 9876543210@paytm" />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>
          <p style={s.switchText}>
            Already have an account? <Link to="/login" style={s.switchLink}>Sign in</Link>
          </p>
          <p style={s.terms}>
            By creating an account you agree to our{' '}
            <span style={{ color: 'var(--ink-muted)' }}>Terms of Service</span>
          </p>
        </div>
      </div>
      <div style={s.right}>
        <div style={s.featureList}>
          <p style={s.featureHeadline}>Everything you need to<br/>get paid on time</p>
          {['Create a deal in 2 minutes', 'Client signs digitally — no PDF', 'UPI payment link auto-generated', 'Track viewed, signed, paid status'].map((f, i) => (
            <div key={i} style={s.featureItem}>
              <div style={s.featureCheck}>✓</div>
              <span style={s.featureText}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', background: 'var(--white)' },
  left: { flex: '0 0 500px', display: 'flex', flexDirection: 'column', padding: '32px 48px', borderRight: '1px solid var(--border)' },
  logo: { display: 'flex', alignItems: 'center', gap: 9, marginBottom: 40 },
  logoMark: { width: 30, height: 30, background: 'var(--ink)', color: 'var(--white)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 },
  logoText: { fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em', color: 'var(--ink)' },
  leftContent: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 380, margin: '0 auto', width: '100%' },
  headline: { fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--ink)', marginBottom: 8 },
  sub: { color: 'var(--ink-muted)', fontSize: 14.5, marginBottom: 24 },
  row: { display: 'flex', gap: 12 },
  switchText: { textAlign: 'center', fontSize: 13.5, color: 'var(--ink-muted)', marginTop: 20 },
  switchLink: { color: 'var(--teal-500)', fontWeight: 600 },
  terms: { textAlign: 'center', fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 16, lineHeight: 1.6 },
  right: { flex: 1, background: 'var(--teal-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' },
  featureList: { maxWidth: 360 },
  featureHeadline: { fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.3, marginBottom: 32 },
  featureItem: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 },
  featureCheck: { width: 26, height: 26, background: 'rgba(255,255,255,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 700, flexShrink: 0 },
  featureText: { fontSize: 15, color: 'rgba(255,255,255,0.9)', fontWeight: 500 },
};
