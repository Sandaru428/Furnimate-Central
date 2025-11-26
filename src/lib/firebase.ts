
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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

export { app, auth, db };
