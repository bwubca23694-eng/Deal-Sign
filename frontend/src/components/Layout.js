import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InstallBanner from './InstallBanner';

const NAV = [
  { to: '/dashboard',   icon: '◉', label: 'Dashboard'  },
  { to: '/create-deal', icon: '+',  label: 'New Deal'   },
  { to: '/profile',     icon: '⚙', label: 'Settings'   },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const initials = (user?.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      {/* Overlay */}
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      {/* Sidebar */}
      <aside className={`app-sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-head">
          <div className="logo">
            <div className="logo-mark">D</div>
            <span className="logo-text">DealFlow</span>
          </div>
          <button className="icon-btn" onClick={() => setOpen(false)} style={{ display: open ? 'flex' : 'none' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, label }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-row">
            <div className="user-av">
              {user?.avatar
                ? <img src={user.avatar} alt="avatar" />
                : initials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="user-name">{user?.name}</div>
              <div className="user-upi">
                {user?.upiId
                  ? user.upiId
                  : <span style={{ color: 'var(--red)' }}>No UPI set</span>}
              </div>
            </div>
          </div>
          <div className="foot-row">
            <button className="btn btn-ghost btn-sm"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { logout(); navigate('/'); }}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="app-main">
        {/* Mobile topbar */}
        <header className="topbar">
          <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Menu">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="logo">
            <div className="logo-mark">D</div>
            <span className="logo-text">DealFlow</span>
          </div>
          <button className="btn btn-green btn-sm" onClick={() => navigate('/create-deal')}>+ Deal</button>
        </header>

        <div className="app-content fade-up" key={location.pathname}>
          <Outlet />
        </div>
      </main>

      {/* Install banner — only shown when logged in */}
      <InstallBanner />
    </div>
  );
}
