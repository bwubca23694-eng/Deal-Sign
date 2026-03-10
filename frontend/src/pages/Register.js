import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const API     = process.env.REACT_APP_API_URL || '/api';
const BACKEND = process.env.REACT_APP_API_URL?.replace('/api','') || '';

const SunIcon  = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const MoonIcon = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>;

export default function Register() {
  const { login } = useAuth();
  const { theme, toggle } = useTheme();
  const [form,    setForm]    = useState({ name:'', email:'', password:'', upiId:'' });
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
    } catch (err) { setError(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const googleLogin = () => { window.location.href = `${BACKEND}/api/auth/google`; };

  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={s.topBar}>
          <div style={s.logo}><div style={s.logoMark}>D</div><span style={s.logoText}>DealFlow</span></div>
          <button style={s.themeBtn} onClick={toggle}>{theme === 'dark' ? <SunIcon /> : <MoonIcon />}</button>
        </div>

        <div style={s.formWrap}>
          <h1 style={s.h1}>Create account</h1>
          <p style={s.sub}>Start sending professional proposals in minutes.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn-google btn" onClick={googleLogin}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <div className="divider-text">or sign up with email</div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="field" style={{ marginBottom:0 }}>
              <label>Full name</label>
              <input value={form.name} onChange={set('name')} placeholder="Arjun Kumar" required autoComplete="name" />
            </div>
            <div className="field" style={{ marginBottom:0 }}>
              <label>Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div className="field" style={{ marginBottom:0 }}>
              <label>Password</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" required autoComplete="new-password" />
            </div>
            <div className="field" style={{ marginBottom:0 }}>
              <label>UPI ID <span className="optional">(add now or later)</span></label>
              <input value={form.upiId} onChange={set('upiId')} placeholder="yourname@upi" style={{ fontFamily:'var(--mono)' }} />
              <div style={{ fontSize:11.5,color:'var(--ink-faint)',marginTop:5 }}>Clients pay you directly via UPI — no payment gateway needed.</div>
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Creating account…' : 'Create free account →'}
            </button>
          </form>

          <p style={s.switchLine}>Already have an account? <Link to="/login" style={s.link}>Sign in</Link></p>
        </div>
      </div>

      <div style={s.right}>
        <div style={s.panel}>
          <div style={s.panelTitle}>Everything you need to get paid</div>
          {[
            ['📋', 'Professional proposals', 'Create detailed project proposals in seconds.'],
            ['✍', 'Digital signatures',      'Clients sign from any device, no app needed.'],
            ['💸', 'Instant UPI payments',   'Pre-filled UPI link for one-tap payment.'],
            ['📥', 'Signed contracts',        'Download PDF contracts with signatures.'],
          ].map(([icon, title, desc]) => (
            <div key={title} style={s.feature}>
              <div style={s.featureIcon}>{icon}</div>
              <div>
                <div style={s.featureTitle}>{title}</div>
                <div style={s.featureDesc}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  page:        { display:'flex', minHeight:'100vh', background:'var(--bg)' },
  left:        { width:'100%', maxWidth:480, display:'flex', flexDirection:'column', padding:'0 48px', background:'var(--surface)', boxShadow:'var(--shadow-md)' },
  right:       { flex:1, background:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', padding:48 },
  topBar:      { display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:24 },
  logo:        { display:'flex', alignItems:'center', gap:8 },
  logoMark:    { width:30,height:30,background:'var(--bg)',color:'var(--ink)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:15 },
  logoText:    { fontWeight:800,fontSize:17,letterSpacing:'-0.03em',color:'var(--ink)' },
  themeBtn:    { background:'none',border:'1px solid var(--border)',borderRadius:7,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--ink-muted)' },
  formWrap:    { flex:1, display:'flex', flexDirection:'column', justifyContent:'center', maxWidth:360, margin:'0 auto', width:'100%', paddingBottom:40, gap:16 },
  h1:          { fontSize:28,fontWeight:800,letterSpacing:'-0.03em',color:'var(--ink)' },
  sub:         { fontSize:14,color:'var(--ink-muted)',marginTop:-8 },
  switchLine:  { textAlign:'center',fontSize:13.5,color:'var(--ink-muted)',marginTop:4 },
  link:        { color:'var(--teal-500)',fontWeight:700,textDecoration:'none' },
  panel:       { maxWidth:380, display:'flex', flexDirection:'column', gap:24 },
  panelTitle:  { fontSize:22,fontWeight:800,letterSpacing:'-0.03em',color:'#fff',marginBottom:4 },
  feature:     { display:'flex', alignItems:'flex-start', gap:14 },
  featureIcon: { width:38,height:38,background:'rgba(255,255,255,.1)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0 },
  featureTitle:{ fontSize:14,fontWeight:700,color:'#fff',marginBottom:2 },
  featureDesc: { fontSize:12.5,color:'rgba(255,255,255,.5)',lineHeight:1.55 },
};
