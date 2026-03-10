import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import CreateDeal from './pages/CreateDeal';
import Profile from './pages/Profile';
import ClientDeal from './pages/ClientDeal';
import Layout from './components/Layout';
import Landing from './pages/Landing';

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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing */}
          <Route path="/" element={<PublicOnly><Landing /></PublicOnly>} />

          {/* Public client deal page – no auth required */}
          <Route path="/deal/:dealId" element={<ClientDeal />} />

          {/* OAuth callback handler */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Auth */}
          <Route path="/login"    element={<PublicOnly><Login    /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

          {/* Protected freelancer app */}
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="dashboard"   element={<Dashboard />} />
            <Route path="create-deal" element={<CreateDeal />} />
            <Route path="profile"     element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
