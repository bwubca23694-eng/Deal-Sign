import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV = [
  { to: '/dashboard',   label: 'Dashboard' },
  { to: '/create-deal', label: 'New Deal'  },
  { to: '/profile',     label: 'Settings'  },
];

const SunIcon  = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
const MoonIcon = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>;

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '?';

  return (
    <div style={s.shell}>
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside style={{ ...s.sidebar, ...(open ? s.sidebarOpen : {}) }}>
        <div style={s.sidebarHead}>
          <div style={s.logo}><div style={s.logoMark}>D</div><span style={s.logoText}>DealFlow</span></div>
          <button style={s.iconBtn} onClick={() => setOpen(false)} className="hide-desktop" aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        <nav style={s.nav}>
          {NAV.map(({ to, label }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}
              style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navActive : {}) })}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={s.sidebarFoot}>
          <div style={s.userRow}>
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" style={s.avatarImg} />
              : <div style={s.avatar}>{initials}</div>}
            <div style={s.userMeta}>
              <div style={s.userName}>{user?.name}</div>
              <div style={s.userUpi}>{user?.upiId || <span style={{ color: 'var(--red-500)' }}>No UPI set</span>}</div>
            </div>
          </div>
          <div style={s.footActions}>
            <button style={s.iconBtn} onClick={toggle} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <button style={{ ...s.iconBtn, flex: 1, gap: 6, fontSize: 12.5, color: 'var(--ink-muted)' }} onClick={() => { logout(); navigate('/'); }}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {open && <div style={s.overlay} onClick={() => setOpen(false)} />}

      {/* ── Main ─────────────────────────────────────────────── */}
      <main style={s.main}>
        {/* Mobile topbar */}
        <header style={s.topbar}>
          <button style={s.iconBtn} onClick={() => setOpen(true)} aria-label="Open menu">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
          <div style={s.logo}><div style={s.logoMark}>D</div><span style={s.logoText}>DealFlow</span></div>
          <button style={s.iconBtn} onClick={toggle}>{theme === 'dark' ? <SunIcon /> : <MoonIcon />}</button>
        </header>

        <div style={s.content} className="fade-up" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const s = {
  shell:    { display: 'flex', minHeight: '100vh', background: 'var(--bg)' },
  sidebar:  { width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0, zIndex: 100, transition: 'transform .25s' },
  sidebarOpen: {},
  sidebarHead: { padding: '18px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo:     { display: 'flex', alignItems: 'center', gap: 8 },
  logoMark: { width: 28, height: 28, background: 'var(--ink)', color: 'var(--bg)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 },
  logoText: { fontWeight: 800, fontSize: 15.5, letterSpacing: '-0.03em', color: 'var(--ink)' },
  nav:      { flex: 1, padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 2 },
  navItem:  { display: 'flex', alignItems: 'center', padding: '9px 10px', borderRadius: 8, fontSize: 13.5, fontWeight: 600, color: 'var(--ink-muted)', transition: 'all .12s' },
  navActive: { background: 'var(--surface2)', color: 'var(--ink)' },
  sidebarFoot: { padding: '12px 14px', borderTop: '1px solid var(--border)' },
  userRow:  { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar:   { width: 32, height: 32, background: 'var(--ink)', color: 'var(--bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 },
  avatarImg:{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' },
  userMeta: { minWidth: 0, flex: 1 },
  userName: { fontSize: 13, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userUpi:  { fontSize: 10.5, color: 'var(--ink-faint)', fontFamily: 'var(--mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  footActions: { display: 'flex', gap: 6 },
  iconBtn:  { background: 'none', border: '1px solid var(--border)', borderRadius: 7, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink-muted)', transition: 'background .12s', flexShrink: 0 },
  overlay:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 99, backdropFilter: 'blur(2px)' },
  main:     { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' },
  topbar:   { display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 },
  content:  { padding: '28px 24px', flex: 1, maxWidth: 960, width: '100%' },
};

// Inject responsive CSS
const style = document.createElement('style');
style.textContent = `
@media(max-width:768px){
  [data-layout-sidebar]{transform:translateX(-100%)!important;position:fixed!important;box-shadow:var(--shadow-xl);}
  [data-layout-sidebar-open]{transform:translateX(0)!important;}
  [data-layout-topbar]{display:flex!important;}
  [data-layout-content]{padding:20px 16px!important;}
}`;
if (!document.querySelector('[data-layout-style]')) {
  style.setAttribute('data-layout-style', '');
  document.head.appendChild(style);
}
