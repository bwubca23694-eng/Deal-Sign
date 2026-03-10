import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard',   label: 'Dashboard',   icon: DashIcon },
  { to: '/create-deal', label: 'New Deal',     icon: PlusIcon },
  { to: '/profile',     label: 'Settings',     icon: GearIcon },
];

function DashIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1.5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
function PlusIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill={active ? 'currentColor' : 'none'}/>
      <path d="M8 5v6M5 8h6" stroke={active ? 'white' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function GearIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div style={s.shell}>
      {/* Sidebar */}
      <aside style={{ ...s.sidebar, ...(mobileOpen ? s.sidebarOpen : {}) }}>
        <div style={s.sidebarTop}>
          <Link_div to="/" style={s.logo} onClick={() => setMobileOpen(false)}>
            <div style={s.logoMark}>D</div>
            <span style={s.logoText}>DealFlow</span>
          </Link_div>
        </div>

        <nav style={s.nav}>
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navItemActive : {}) })}
                onClick={() => setMobileOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    <span style={{ ...s.navIcon, ...(isActive ? s.navIconActive : {}) }}>
                      <Icon active={isActive} />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div style={s.sidebarFooter}>
          <div style={s.userBlock}>
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" style={s.avatarImg} />
            ) : (
              <div style={s.avatar}>{initials}</div>
            )}
            <div style={s.userInfo}>
              <div style={s.userName}>{user?.name}</div>
              <div style={s.userMeta}>{user?.upiId || <span style={{ color: 'var(--red-500)', fontWeight: 600 }}>No UPI set</span>}</div>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>Sign out</button>
        </div>
      </aside>

      {mobileOpen && <div style={s.overlay} onClick={() => setMobileOpen(false)} />}

      {/* Main content */}
      <main style={s.main}>
        <header style={s.mobileHeader}>
          <button style={s.hamburger} onClick={() => setMobileOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 6h14M3 10h14M3 14h14" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
          <div style={s.logo}><div style={s.logoMark}>D</div><span style={s.logoText}>DealFlow</span></div>
        </header>

        <div style={s.content} className="fade-up" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// Small helper to avoid importing Link (which would break logo clicking)
function Link_div({ to, style, children, onClick }) {
  return <div style={{ ...style, cursor: 'pointer' }} onClick={onClick}>{children}</div>;
}

const s = {
  shell: { display: 'flex', minHeight: '100vh', background: 'var(--gray-25)' },
  sidebar: {
    width: 228,
    background: 'var(--white)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
    flexShrink: 0,
    zIndex: 100,
  },
  sidebarOpen: { position: 'fixed', left: 0, top: 0, bottom: 0 },
  sidebarTop: { padding: '20px 20px 12px' },
  logo: { display: 'flex', alignItems: 'center', gap: 9 },
  logoMark: { width: 28, height: 28, background: 'var(--ink)', color: 'var(--white)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 },
  logoText: { fontWeight: 800, fontSize: 15.5, letterSpacing: '-0.03em', color: 'var(--ink)' },
  nav: { flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '9px 10px',
    borderRadius: 8,
    fontSize: 13.5, fontWeight: 600, color: 'var(--ink-muted)',
    transition: 'background 0.12s, color 0.12s',
    letterSpacing: '-0.01em',
  },
  navItemActive: { background: 'var(--gray-50)', color: 'var(--ink)' },
  navIcon: { display: 'flex', alignItems: 'center', color: 'var(--ink-faint)' },
  navIconActive: { color: 'var(--ink)' },
  sidebarFooter: { padding: '14px', borderTop: '1px solid var(--border)' },
  userBlock: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 32, height: 32, background: 'var(--gray-800)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 },
  avatarImg: { width: 32, height: 32, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' },
  userInfo: { minWidth: 0, flex: 1 },
  userName: { fontSize: 13, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' },
  userMeta: { fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--mono)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  logoutBtn: { width: '100%', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, padding: '7px', fontSize: 12.5, fontWeight: 600, color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background 0.1s' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 99, backdropFilter: 'blur(2px)' },
  main: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' },
  mobileHeader: { display: 'none', alignItems: 'center', gap: 14, padding: '14px 20px', background: 'var(--white)', borderBottom: '1px solid var(--border)' },
  hamburger: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' },
  content: { padding: '32px 36px', flex: 1, maxWidth: 1000 },
};
