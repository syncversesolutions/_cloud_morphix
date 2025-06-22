import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB04ocOZTZesgrOqS126hL1ALu5QmZuoe0",
  authDomain: "cloudmorphix-602b1.firebaseapp.com",
  projectId: "cloudmorphix-602b1",
  storageBucket: "cloudmorphix-602b1.appspot.com",
  messagingSenderId: "115572239201",
  appId: "1:115572239201:web:1671fe090cf49dd362f320",
  measurementId: "G-RJW8F0RYX2"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
