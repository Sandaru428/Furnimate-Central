
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "studio-6159115705-55b24",
  "appId": "1:743515300267:web:240c7e5444f928009e72ee",
  "storageBucket": "studio-6159115705-55b24.firebasestorage.app",
  "apiKey": "AIzaSyAzxB6V0fZTks7O7VCHKbfaJcN85Kau4bQ",
  "authDomain": "studio-6159115705-55b24.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "743515300267"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
