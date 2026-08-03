import { createContext, useContext, useState, useEffect } from "react";

// ─── Firebase Bridge (activates when .env.local has real credentials) ─────────
let firebaseEnabled = false;
let onAuthChangeFn = null;
let signInFn = null;
let signUpFn = null;
let signOutFn = null;
let signInGoogleFn = null;

try {
  const fb = require("../firebase/hooks");
  const cfg = require("../firebase/config");
  if (
    cfg.auth &&
    !cfg.auth.app.options.apiKey?.startsWith("YOUR_") &&
    cfg.auth.app.options.apiKey !== "YOUR_API_KEY"
  ) {
    firebaseEnabled = true;
    onAuthChangeFn   = fb.onAuthStateChanged;
    signInFn         = fb.signInWithEmail;
    signUpFn         = fb.signUpWithEmail;
    signOutFn        = fb.signOut;
    signInGoogleFn   = fb.signInWithGoogle;
  }
} catch {
  firebaseEnabled = false;
}
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);
const LS_KEY = "travelo_auth_v4";

const DEFAULT_USER = {
  _id: "sayan_hq",
  name: "SAYAN",
  email: "admin@travelo.app",
  role: "ADMIN",
  provider: "local",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem(LS_KEY);
      return s ? JSON.parse(s) : DEFAULT_USER;
    } catch { return DEFAULT_USER; }
  });
  const [loading, setLoading] = useState(firebaseEnabled);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!firebaseEnabled || !onAuthChangeFn) return;
    const unsub = onAuthChangeFn((fbUser) => {
      if (fbUser) {
        const u = {
          _id:      fbUser.uid,
          name:     (fbUser.displayName || fbUser.email.split("@")[0]).toUpperCase(),
          email:    fbUser.email,
          role:     "USER",
          provider: "firebase",
          photoURL: fbUser.photoURL || null,
        };
        setUser(u);
        localStorage.setItem(LS_KEY, JSON.stringify(u));
      } else {
        setUser(null);
        localStorage.removeItem(LS_KEY);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      if (firebaseEnabled && signInFn) {
        const fbUser = await signInFn(email, password);
        const u = {
          _id:      fbUser.uid,
          name:     (fbUser.displayName || email.split("@")[0]).toUpperCase(),
          email:    fbUser.email,
          role:     "USER",
          provider: "firebase",
        };
        setUser(u);
        localStorage.setItem(LS_KEY, JSON.stringify(u));
        return u;
      }
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
    // LocalStorage fallback
    const u = { ...DEFAULT_USER, email: email || DEFAULT_USER.email };
    setUser(u);
    localStorage.setItem(LS_KEY, JSON.stringify(u));
    return u;
  };

  const register = async (name, email, password) => {
    setAuthError(null);
    try {
      if (firebaseEnabled && signUpFn) {
        const fbUser = await signUpFn(email, password, name);
        const u = {
          _id:      fbUser.uid,
          name:     (name || fbUser.email.split("@")[0]).toUpperCase(),
          email:    fbUser.email,
          role:     "USER",
          provider: "firebase",
        };
        setUser(u);
        localStorage.setItem(LS_KEY, JSON.stringify(u));
        return u;
      }
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
    // LocalStorage fallback
    const u = {
      ...DEFAULT_USER,
      name:  (name || "OPERATIVE").toUpperCase(),
      email: email || DEFAULT_USER.email,
    };
    setUser(u);
    localStorage.setItem(LS_KEY, JSON.stringify(u));
    return u;
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    if (firebaseEnabled && signInGoogleFn) {
      try {
        const fbUser = await signInGoogleFn();
        const u = {
          _id:      fbUser.uid,
          name:     (fbUser.displayName || fbUser.email.split("@")[0]).toUpperCase(),
          email:    fbUser.email,
          role:     "USER",
          provider: "google",
          photoURL: fbUser.photoURL || null,
        };
        setUser(u);
        localStorage.setItem(LS_KEY, JSON.stringify(u));
        return u;
      } catch (err) {
        setAuthError(err.message);
        throw err;
      }
    }
    // Fallback when Firebase not configured
    const u = { ...DEFAULT_USER, name: "GOOGLE USER", provider: "google" };
    setUser(u);
    localStorage.setItem(LS_KEY, JSON.stringify(u));
    return u;
  };

  const logout = async () => {
    if (firebaseEnabled && signOutFn) {
      try { await signOutFn(); } catch {/* ignore */ }
    }
    setUser(null);
    localStorage.removeItem(LS_KEY);
  };

  const clearError = () => setAuthError(null);

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, loading, authError, clearError, firebaseEnabled }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
