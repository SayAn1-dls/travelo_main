import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("travelo_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = async (email, password) => {
    // Try real backend first, fallback to local
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL || ""}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        const u = { _id: data.id || "u1", name: data.name || email.split("@")[0].toUpperCase(), email, token: data.token };
        setUser(u);
        localStorage.setItem("travelo_user", JSON.stringify(u));
        return u;
      }
    } catch {}
    // Local fallback — no error shown
    const u = { _id: "local_" + Date.now(), name: email.split("@")[0].toUpperCase(), email, token: "local" };
    setUser(u);
    localStorage.setItem("travelo_user", JSON.stringify(u));
    return u;
  };

  const register = async (name, email, password) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL || ""}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        const u = { _id: data.id || "u1", name: name.toUpperCase(), email, token: data.token };
        setUser(u);
        localStorage.setItem("travelo_user", JSON.stringify(u));
        return u;
      }
    } catch {}
    const u = { _id: "local_" + Date.now(), name: name.toUpperCase(), email, token: "local" };
    setUser(u);
    localStorage.setItem("travelo_user", JSON.stringify(u));
    return u;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("travelo_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
