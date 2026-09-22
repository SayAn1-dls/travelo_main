import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { getToken, setToken, clearToken } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    // Hard timeout — if restore hangs for any reason, unblock the UI in 2s
    const timeout = setTimeout(() => { if (mounted) setLoading(false); }, 2000);
    async function restore() {
      try {
        if (!getToken()) { setLoading(false); return; }
        const me = await api.me();
        if (mounted) setUser(me);
      } catch (err) {
        try { clearToken(); } catch { /* ignore */ }
      } finally {
        clearTimeout(timeout);
        if (mounted) setLoading(false);
      }
    }
    restore();
    return () => { mounted = false; clearTimeout(timeout); };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await api.register({ name, email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = { user, loading, login, register, logout, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
