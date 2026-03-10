import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '⬡' },
  { to: '/create-deal', label: 'New Deal', icon: '+' },
  { to: '/profile', label: 'Settings', icon: '◎' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, ...(mobileOpen ? styles.sidebarOpen : {}) }}>
        <div style={styles.logo}>
          <span style={styles.logoMark}>D</span>
          <span style={styles.logoText}>DealFlow</span>
        </div>

        <nav style={styles.nav}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {})
              })}
              onClick={() => setMobileOpen(false)}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={styles.sidebarBottom}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div style={styles.userName}>{user?.name}</div>
              <div style={styles.userUpi}>{user?.upiId || 'No UPI set'}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={styles.overlay} onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <main style={styles.main}>
        {/* Mobile topbar */}
        <div style={styles.topbar}>
          <button style={styles.menuBtn} onClick={() => setMobileOpen(!mobileOpen)}>
            ☰
          </button>
          <span style={styles.logoText}>DealFlow</span>
        </div>

        <div style={styles.content} className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const styles = {
  shell: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--bg)',
  },
  sidebar: {
    width: 240,
    background: 'var(--surface)',
    borderRight: '1.5px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 0',
    position: 'sticky',
    top: 0,
    height: '100vh',
    flexShrink: 0,
    zIndex: 100,
  },
  sidebarOpen: {
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 24px 32px',
  },
  logoMark: {
    width: 32,
    height: 32,
    background: 'var(--accent)',
    color: '#000',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 16,
  },
  logoText: {
    fontWeight: 800,
    fontSize: 17,
    letterSpacing: '-0.02em',
  },
  nav: {
    flex: 1,
    padding: '0 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-muted)',
    transition: 'background 0.15s, color 0.15s',
  },
  navLinkActive: {
    background: 'rgba(126,255,139,0.1)',
    color: 'var(--accent)',
  },
  navIcon: {
    fontSize: 16,
    width: 20,
    textAlign: 'center',
  },
  sidebarBottom: {
    padding: '24px',
    borderTop: '1.5px solid var(--border)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    background: 'var(--accent)',
    color: '#000',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 14,
    flexShrink: 0,
  },
  userName: { fontSize: 13, fontWeight: 700 },
  userUpi: { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' },
  logoutBtn: {
    width: '100%',
    padding: '8px',
    background: 'transparent',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    overflow: 'hidden',
  },
  topbar: {
    display: 'none',
    alignItems: 'center',
    gap: 16,
    padding: '16px 20px',
    borderBottom: '1.5px solid var(--border)',
    background: 'var(--surface)',
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text)',
    fontSize: 20,
    cursor: 'pointer',
  },
  content: {
    padding: '32px',
    flex: 1,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 99,
  },
};
