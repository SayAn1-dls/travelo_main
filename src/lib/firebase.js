import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "demo-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "travelo-demo.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "travelo-demo",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "travelo-demo.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "12345",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:12345:web:demo"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;