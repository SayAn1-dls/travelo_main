import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { localAuth } from '../lib/localStorageEngine';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const session = localAuth.getSession();
      if (session) setUser(session);
    } catch (err) {
      console.error('[AuthContext] session restore failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const session = localAuth.login(email, password);
    setUser(session);
    return session;
  }, []);

  const register = useCallback(async (email, password, displayName) => {
    const session = localAuth.register(email, password, displayName);
    setUser(session);
    return session;
  }, []);

  const logout = useCallback(() => {
    localAuth.logout();
    setUser(null);
  }, []);

  const value = { user, loading, login, register, logout, isAuthenticated: !!user };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;
