// ─────────────────────────────────────────────────
//  TRAVELO v4.0 — Firebase Auth Hooks
//  Replace .env.local values to activate Firebase.
//  All LocalStorage flows remain intact as fallback.
// ─────────────────────────────────────────────────
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as _signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged as _onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "./config";

export const signInWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password).then(c => c.user);

export const signUpWithEmail = async (email, password, displayName) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(credential.user, {
      displayName: displayName.toUpperCase(),
    });
  }
  return credential.user;
};

export const signOut = () => _signOut(auth);

export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

export const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");
  return signInWithPopup(auth, provider).then(c => c.user);
};

export const onAuthStateChanged = (callback) =>
  _onAuthStateChanged(auth, callback);
