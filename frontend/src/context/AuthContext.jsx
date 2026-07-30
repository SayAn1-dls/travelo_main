import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Skip /me check while returning from OAuth — AuthCallback establishes the session first
    if (window.location.hash?.includes("session_id=")) return;
    api.get("/auth/me").then((r) => setUser(r.data)).catch(() => setUser(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("travelo_token", data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("travelo_token", data.access_token);
    setUser(data.user);
    return data.user;
  };

  const googleSession = async (sessionId) => {
    const { data } = await api.post("/auth/google/session", { session_id: sessionId });
    localStorage.setItem("travelo_token", data.session_token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    localStorage.removeItem("travelo_token");
    setUser(false);
  };

  const refreshMe = async () => {
    const { data } = await api.get("/auth/me");
    setUser(data);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, googleSession, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
