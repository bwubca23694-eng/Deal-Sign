import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const InstallContext = createContext(null);

// Check if already running as installed PWA
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

export const InstallProvider = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner,     setShowBanner]     = useState(false);
  const [triggered,      setTriggered]      = useState(false);

  useEffect(() => {
    const handler = e => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    // If user installs, hide banner and save to localStorage
    const installed = () => {
      setShowBanner(false);
      localStorage.setItem('install-done', '1');
    };
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  const triggerBanner = useCallback(() => {
    if (triggered) return;               // only run once per session
    setTriggered(true);
    if (isStandalone()) return;          // already installed — never show
    if (localStorage.getItem('install-done')) return;   // user already installed
    if (localStorage.getItem('install-dismissed')) return; // user dismissed permanently
    setTimeout(() => setShowBanner(true), 8000);
  }, [triggered]);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowBanner(false);
    if (outcome === 'accepted') localStorage.setItem('install-done', '1');
  };

  const dismiss = () => {
    setShowBanner(false);
    localStorage.setItem('install-dismissed', '1'); // permanent — never show again
  };

  return (
    <InstallContext.Provider value={{ showBanner, install, dismiss, canInstall: !!deferredPrompt, triggerBanner }}>
      {children}
    </InstallContext.Provider>
  );
};

export const useInstall = () => useContext(InstallContext);