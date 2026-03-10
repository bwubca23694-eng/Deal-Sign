import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', upiId: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.upiId);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div style={styles.page}>
      <div style={styles.box} className="page-enter">
        <div style={styles.header}>
          <div style={styles.logoMark}>D</div>
          <h1 style={styles.title}>Create account</h1>
          <p style={styles.subtitle}>Start closing deals faster</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Full Name</label>
            <input value={form.name} onChange={set('name')} placeholder="Aditya Kumar" required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" required minLength={6} />
          </div>
          <div className="field">
            <label>UPI ID <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(optional, add later)</span></label>
            <input value={form.upiId} onChange={set('upiId')} placeholder="yourname@upi" />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.link}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    background: 'var(--bg)',
  },
  box: {
    width: '100%',
    maxWidth: 420,
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '40px 36px',
  },
  header: {
    textAlign: 'center',
    marginBottom: 32,
  },
  logoMark: {
    width: 48,
    height: 48,
    background: 'var(--accent)',
    color: '#000',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 22,
    margin: '0 auto 16px',
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: '-0.02em',
    marginBottom: 6,
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: 14,
  },
  link: {
    textAlign: 'center',
    fontSize: 13,
    color: 'var(--text-muted)',
    marginTop: 20,
  },
};
