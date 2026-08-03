// ─────────────────────────────────────────────────
//  TRAVELO v4.0 — Firebase Configuration
//  ⚠️  PLACEHOLDER — Copy .env.example to .env.local and fill in your values
//      from https://console.firebase.google.com → Project Settings → Your Apps
// ─────────────────────────────────────────────────
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID || "YOUR_PROJECT",
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId:             process.env.REACT_APP_FIREBASE_APP_ID || "YOUR_APP_ID",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export default app;
