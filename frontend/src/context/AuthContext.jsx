import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const ADMIN_USER = {
  _id: "sayan_hq",
  name: "SAYAN (ADMIN)",
  email: "admin@travelo.app",
  role: "ADMIN"
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("travelo_auth_v29");
    return saved ? JSON.parse(saved) : ADMIN_USER;
  });

  const login = async () => {
    setUser(ADMIN_USER);
    localStorage.setItem("travelo_auth_v29", JSON.stringify(ADMIN_USER));
    return ADMIN_USER;
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

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
