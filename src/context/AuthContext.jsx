import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const ADMIN_USER = { _id: "sayan_hq", name: "SAYAN", email: "admin@travelo.app", role: "ADMIN" };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem("travelo_auth_v29");
      return s ? JSON.parse(s) : ADMIN_USER;
    } catch { return ADMIN_USER; }
  });

  const login = async (email) => {
    const u = { ...ADMIN_USER, email: email || ADMIN_USER.email };
    setUser(u);
    localStorage.setItem("travelo_auth_v29", JSON.stringify(u));
    return u;
  };

  const register = async (name) => {
    const u = { ...ADMIN_USER, name: (name || "SAYAN").toUpperCase() };
    setUser(u);
    localStorage.setItem("travelo_auth_v29", JSON.stringify(u));
    return u;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("travelo_auth_v29");
  };

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
