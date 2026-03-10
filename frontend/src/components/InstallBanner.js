import React, { useEffect } from 'react';
import { useInstall } from '../context/InstallContext';

export default function InstallBanner() {
  const { showBanner, install, dismiss, canInstall, triggerBanner } = useInstall();

  // Trigger after this component mounts (means user is logged in inside Layout)
  useEffect(() => { triggerBanner(); }, [triggerBanner]);

  if (!showBanner) return null;

  return (
    <div className="install-banner">
      <span style={{ fontSize: 26 }}>📲</span>
      <div style={{ flex: 1 }}>
        <div className="install-banner-title">Install DealFlow</div>
        <div className="install-banner-sub">Works offline · No app store needed</div>
      </div>
      {canInstall && (
        <button className="install-btn" onClick={install}>Install</button>
      )}
      <button className="install-dismiss" onClick={dismiss}>×</button>
    </div>
  );
}
