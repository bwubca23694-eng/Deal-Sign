import React, { createContext, useContext, useEffect, useState } from 'react';

const InstallContext = createContext(null);

export const InstallProvider = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner after 30 seconds or on second visit
      const visits = Number(sessionStorage.getItem('df-visits') || 0) + 1;
      sessionStorage.setItem('df-visits', visits);
      if (visits >= 2 || true) setShowBanner(true); // show on first visit for demo
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowBanner(false);
    return outcome;
  };

  const dismiss = () => setShowBanner(false);

  return (
    <InstallContext.Provider value={{ showBanner, install, dismiss, canInstall: !!deferredPrompt }}>
      {children}
    </InstallContext.Provider>
  );
};

export const useInstall = () => useContext(InstallContext);
