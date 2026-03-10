import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('df-user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback((token, userData) => {
    localStorage.setItem('df-token', token);
    localStorage.setItem('df-user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const loginWithToken = useCallback(async (token) => {
    localStorage.setItem('df-token', token);
    const res = await axios.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    localStorage.setItem('df-user', JSON.stringify(res.data));
    setUser(res.data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('df-token');
    localStorage.removeItem('df-user');
    setUser(null);
  }, []);

  const updateUser = useCallback((data) => {
    const updated = { ...user, ...data };
    localStorage.setItem('df-user', JSON.stringify(updated));
    setUser(updated);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithToken, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
