import React from 'react';
import { useInstall } from '../context/InstallContext';

export default function InstallBanner() {
  const { showBanner, install, dismiss } = useInstall();
  if (!showBanner) return null;

  return (
    <div className="install-banner">
      <div style={{ fontSize: 28 }}>📱</div>
      <div style={{ flex: 1 }}>
        <div className="install-banner-text">Install DealFlow</div>
        <div className="install-banner-sub">Add to home screen for faster access</div>
      </div>
      <button
        onClick={install}
        style={{ background: 'var(--teal-500)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
      >
        Install
      </button>
      <button
        onClick={dismiss}
        style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: 'inherit', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      >
        ×
      </button>
    </div>
  );
}
