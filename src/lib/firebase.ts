
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "furnimate-central",
  "appId": "1:355246282722:web:4ea2798d7e3c1d324e4bbb",
  "storageBucket": "furnimate-central.firebasestorage.app",
  "apiKey": "AIzaSyD6jPBR7SuXvV7Jv-bnpvZFoFk9sUNFS4Q",
  "authDomain": "furnimate-central.firebaseapp.com",
  "measurementId": "G-WJ00H55Y0B",
  "messagingSenderId": "355246282722"
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
