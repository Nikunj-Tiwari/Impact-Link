import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
let auth;

try {
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== "your_api_key_here") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } else {
    console.warn("Firebase: API key is missing or placeholder. Authentication will be disabled.");
  }
} catch (error) {
  console.error("Firebase Initialization Error:", error);
}

export const signUp = (email, password) => {
  if (!auth) throw new Error("Firebase not initialized. Check your .env.local keys.");
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logIn = (email, password) => {
  if (!auth) throw new Error("Firebase not initialized. Check your .env.local keys.");
  return signInWithEmailAndPassword(auth, email, password);
};

export const logout = () => {
  if (!auth) return Promise.resolve();
  return signOut(auth);
};

export const resetPassword = (email) => {
  if (!auth) throw new Error("Firebase not initialized.");
  return sendPasswordResetEmail(auth, email);
};

export { onAuthStateChanged, auth, sendEmailVerification };
