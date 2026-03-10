import React, { createContext, useContext, useEffect, useState } from 'react';

const InstallContext = createContext(null);

export const InstallProvider = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner,     setShowBanner]     = useState(false);

  useEffect(() => {
    const handler = e => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Called by Layout after user is logged in — show banner after 8s
  const triggerBanner = () => {
    const dismissed = sessionStorage.getItem('install-dismissed');
    if (dismissed) return;
    setTimeout(() => setShowBanner(true), 8000);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowBanner(false);
    return outcome;
  };

  const dismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('install-dismissed', '1');
  };

  return (
    <InstallContext.Provider value={{ showBanner, install, dismiss, canInstall: !!deferredPrompt, triggerBanner }}>
      {children}
    </InstallContext.Provider>
  );
};

export const useInstall = () => useContext(InstallContext);
