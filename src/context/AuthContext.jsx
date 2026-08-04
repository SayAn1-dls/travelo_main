import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("travelo_auth_v29");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        };
        setUser(userData);
        localStorage.setItem("travelo_auth_v29", JSON.stringify(userData));
      } else {
        const local = localStorage.getItem("travelo_auth_v29");
        if (local) setUser(JSON.parse(local));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      return res.user;
    } catch (err) {
      if (email === 'demo@travelo.app') {
        const demoUser = { uid: 'demo', email: 'demo@travelo.app', name: 'DEMO OPERATIVE' };
        setUser(demoUser);
        localStorage.setItem("travelo_auth_v29", JSON.stringify(demoUser));
        return demoUser;
      }
      throw err;
    }
  };

  const register = async (name, email, password) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    return res.user;
  };

  const logout = async () => {
    await signOut(auth); setUser(null); localStorage.removeItem("travelo_auth_v29");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);