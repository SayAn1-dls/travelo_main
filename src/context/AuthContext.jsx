import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

const STORAGE_KEY = "travelo_auth_v29";
const USERS_KEY = "travelo_users_v1";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = async (email, password) => {
    if (email === "demo@travelo.app") {
      const demoUser = { uid: "demo", email: "demo@travelo.app", name: "DEMO OPERATIVE" };
      setUser(demoUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser));
      return demoUser;
    }
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) throw new Error("Invalid credentials. Check email and password.");
    const userData = { uid: found.uid, email: found.email, name: found.name };
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    return userData;
  };

  const register = async (name, email, password) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    if (users.find((u) => u.email === email)) throw new Error("Email already registered. Login instead.");
    const newUser = {
      uid: `local_${Date.now()}`,
      email,
      password,
      name: (name || email.split("@")[0]).toUpperCase(),
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const userData = { uid: newUser.uid, email: newUser.email, name: newUser.name };
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
