import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API     = process.env.REACT_APP_API_URL || '/api';
const BACKEND = (process.env.REACT_APP_API_URL || '/api').replace('/api', '');

export default function Register() {
  const { login } = useAuth();
  const [form,    setForm]    = useState({ name: '', email: '', password: '', upiId: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault(); setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/register`, form);
      login(res.data.token, res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const FEATURES = [
    ['📋', 'Professional proposals', 'Create project proposals in seconds.'],
    ['✍',  'Digital signatures',      'Clients sign from any device, instantly.'],
    ['💸', 'UPI payments',            'Pre-filled payment link for one-tap pay.'],
    ['📄', 'Signed PDF contracts',    'Download contracts with embedded signatures.'],
  ];

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
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.03em' }}>Create account</h1>
            <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginTop: 6 }}>Start sending professional proposals in minutes.</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn btn-google" onClick={() => { window.location.href = `${BACKEND}/api/auth/google`; }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="divider-text">or sign up with email</div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key:'name',     type:'text',     label:'Full name',    ph:'Arjun Kumar',        ac:'name'         },
              { key:'email',    type:'email',     label:'Email',        ph:'you@example.com',    ac:'email'        },
              { key:'password', type:'password',  label:'Password',     ph:'Min 6 characters',   ac:'new-password' },
            ].map(({ key, type, label, ph, ac }) => (
              <div className="field" style={{ marginBottom: 0 }} key={key}>
                <label>{label}</label>
                <input type={type} value={form[key]} onChange={set(key)} placeholder={ph} required={key !== 'upiId'} autoComplete={ac} />
              </div>
            ))}
            <div className="field" style={{ marginBottom: 0 }}>
              <label>UPI ID <span className="optional">add now or later</span></label>
              <input value={form.upiId} onChange={set('upiId')} placeholder="yourname@upi" style={{ fontFamily: 'var(--mono)' }} />
              <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 5 }}>
                Clients pay you directly — no payment gateway needed.
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Creating account…' : 'Create free account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--ink-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--green)', fontWeight: 700 }}>Sign in</Link>
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div style={{ maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.03em', color: '#fff' }}>
            Everything you need to get paid
          </div>
          {FEATURES.map(([icon, title, desc]) => (
            <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 38, height: 38, background: 'rgba(255,255,255,.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.5)', lineHeight: 1.55 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
