
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  "appId": process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  "storageBucket": process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  "apiKey": process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  "authDomain": process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  "measurementId": process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  "messagingSenderId": process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Secondary app for creating users without affecting current session
let secondaryApp: FirebaseApp;
let secondaryAuth: Auth | null = null;

try {
  secondaryApp = getApps().find(app => app.name === 'Secondary') || initializeApp(firebaseConfig, 'Secondary');
  secondaryAuth = getAuth(secondaryApp);
} catch (error) {
  console.error('Error initializing secondary app:', error);
}

export { app, auth, db, secondaryAuth };
