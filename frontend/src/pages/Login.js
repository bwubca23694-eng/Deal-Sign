import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const API = process.env.REACT_APP_API_URL || '/api';
const BACKEND = process.env.REACT_APP_API_URL?.replace('/api','') || '';

const SunIcon  = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const MoonIcon = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>;

export default function Login() {
  const { login } = useAuth();
  const { theme, toggle } = useTheme();
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
    } catch (err) { setError(err.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  const googleLogin = () => { window.location.href = `${BACKEND}/api/auth/google`; };

  return (
    <div style={s.page}>
      {/* Left panel */}
      <div style={s.left}>
        <div style={s.topBar}>
          <div style={s.logo}><div style={s.logoMark}>D</div><span style={s.logoText}>DealFlow</span></div>
          <button style={s.themeBtn} onClick={toggle}>{theme === 'dark' ? <SunIcon /> : <MoonIcon />}</button>
        </div>

        <div style={s.formWrap}>
          <h1 style={s.h1}>Welcome back</h1>
          <p style={s.sub}>Sign in to manage your deals and proposals.</p>

          {(error || urlErr) && (
            <div className="alert alert-error">
              {urlErr === 'google_failed' ? 'Google sign-in failed. Please try again.' : error}
            </div>
          )}

          <button className="btn-google btn" onClick={googleLogin}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <div className="divider-text">or continue with email</div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email address</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Your password" required autoComplete="current-password" />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <p style={s.switchLine}>
            Don't have an account? <Link to="/register" style={s.link}>Create one free</Link>
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div style={s.right}>
        <div style={s.testimonial}>
          <p style={s.quote}>"I used to spend days chasing clients for signatures and payments. DealFlow cut that down to hours."</p>
          <div style={s.author}>
            <div style={s.authorAvatar}>PJ</div>
            <div>
              <div style={s.authorName}>Priya Joshi</div>
              <div style={s.authorRole}>Freelance UI/UX Designer, Pune</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:       { display:'flex', minHeight:'100vh', background:'var(--bg)' },
  left:       { width:'100%', maxWidth:480, display:'flex', flexDirection:'column', padding:'0 48px', background:'var(--surface)', boxShadow:'var(--shadow-md)' },
  right:      { flex:1, background:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', padding:48 },
  topBar:     { display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:24, paddingBottom:0 },
  logo:       { display:'flex', alignItems:'center', gap:8 },
  logoMark:   { width:30,height:30,background:'var(--bg)',color:'var(--ink)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:15 },
  logoText:   { fontWeight:800,fontSize:17,letterSpacing:'-0.03em',color:'var(--ink)' },
  themeBtn:   { background:'none',border:'1px solid var(--border)',borderRadius:7,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--ink-muted)' },
  formWrap:   { flex:1, display:'flex', flexDirection:'column', justifyContent:'center', maxWidth:360, margin:'0 auto', width:'100%', paddingBottom:40, gap:16 },
  h1:         { fontSize:28,fontWeight:800,letterSpacing:'-0.03em',color:'var(--ink)' },
  sub:        { fontSize:14,color:'var(--ink-muted)',marginTop:-8 },
  switchLine: { textAlign:'center',fontSize:13.5,color:'var(--ink-muted)',marginTop:4 },
  link:       { color:'var(--teal-500)',fontWeight:700,textDecoration:'none' },
  testimonial:{ maxWidth:400 },
  quote:      { fontFamily:'var(--serif)',fontSize:20,fontStyle:'italic',color:'rgba(255,255,255,.85)',lineHeight:1.65,marginBottom:28 },
  author:     { display:'flex',alignItems:'center',gap:14 },
  authorAvatar:{ width:40,height:40,background:'rgba(255,255,255,.15)',color:'#fff',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,flexShrink:0 },
  authorName: { fontSize:14,fontWeight:700,color:'#fff' },
  authorRole: { fontSize:12,color:'rgba(255,255,255,.5)',marginTop:2 },
};
