import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const called   = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) { navigate('/login?error=token_missing', { replace: true }); return; }

    loginWithToken(token)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => navigate('/login?error=token_invalid', { replace: true }));
  }, [loginWithToken, navigate]);

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, background:'var(--bg)' }}>
      <div style={{ width:48,height:48,background:'var(--ink)',color:'var(--bg)',borderRadius:13,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:22 }}>D</div>
      <div className="spinner" />
      <p style={{ fontSize:13.5, color:'var(--ink-muted)', fontWeight:500 }}>Completing sign in…</p>
    </div>
  );
}
