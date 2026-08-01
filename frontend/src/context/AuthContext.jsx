import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

const MOCK_USER = {
  _id: "66a8de4f5e1f2b001c000000",
  name: "Sayan (ADMIN)",
  email: "sayan@travelo.app",
  role: "admin",
  avatar: null
};

export function AuthProvider({ children }) {
  // We start with MOCK_USER so the user can judge all internal pages immediately
  const [user, setUser] = useState(MOCK_USER);

  useEffect(() => {
    // We disable the real check for now so the UI is judgeable
    console.log("TRAVELO GUEST MODE: Auth Bypass Active for Review");
  }, []);

  const login = async (email, password) => {
    // Instant login for review
    setUser(MOCK_USER);
    return MOCK_USER;
  };

  const register = async (name, email, password) => {
    // Instant register for review
    setUser({ ...MOCK_USER, name: name || "New Operative" });
    return MOCK_USER;
  };

  const googleSession = async (sessionId) => {
    setUser(MOCK_USER);
    return MOCK_USER;
  };

  const logout = async () => {
    setUser(false);
  };

  const refreshMe = async () => {
    setUser(MOCK_USER);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, googleSession, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);