import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '/api';
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);  // true until we verify stored token

  // On mount: verify stored token is still valid
  useEffect(() => {
    const token = localStorage.getItem('df-token');
    if (!token) { setLoading(false); return; }

    axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        localStorage.setItem('df-user', JSON.stringify(res.data));
        setUser(res.data);
      })
      .catch(() => {
        // Token invalid or expired — clear it
        localStorage.removeItem('df-token');
        localStorage.removeItem('df-user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem('df-token', token);
    localStorage.setItem('df-user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const loginWithToken = useCallback(async (token) => {
    localStorage.setItem('df-token', token);
    const res = await axios.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
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
    const updated = { ...data };
    localStorage.setItem('df-user', JSON.stringify(updated));
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithToken, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
