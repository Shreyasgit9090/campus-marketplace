import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cm_token');
    if (!token) {
      setBooting(false);
      return;
    }
    authApi
      .getMe()
      .then(setUser)
      .catch(() => localStorage.removeItem('cm_token'))
      .finally(() => setBooting(false));
  }, []);

  const applySession = useCallback((token, userData) => {
    localStorage.setItem('cm_token', token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cm_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, booting, applySession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
