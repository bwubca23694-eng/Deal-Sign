import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { InstallProvider } from './context/InstallContext';
import ColdStartLoader from './components/ColdStartLoader';
import './index.css';

import Login       from './pages/Login';
import Register    from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import Dashboard   from './pages/Dashboard';
import CreateDeal  from './pages/CreateDeal';
import Profile     from './pages/Profile';
import ClientDeal  from './pages/ClientDeal';
import Layout      from './components/Layout';
import Landing     from './pages/Landing';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
};
const PublicOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader"><div className="spinner" /></div>;
  return !user ? children : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"               element={<PublicOnly><Landing /></PublicOnly>} />
      <Route path="/deal/:dealId"   element={<ClientDeal />} />
      <Route path="/auth/callback"  element={<AuthCallback />} />
      <Route path="/login"          element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register"       element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/"               element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="dashboard"     element={<Dashboard />} />
        <Route path="create-deal"   element={<CreateDeal />} />
        <Route path="profile"       element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [serverReady, setServerReady] = useState(false);
  const handleReady = useCallback(() => setServerReady(true), []);

  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <InstallProvider>
            <BrowserRouter>
              {!serverReady && <ColdStartLoader onReady={handleReady} />}
              {serverReady && <AppRoutes />}
            </BrowserRouter>
          </InstallProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
