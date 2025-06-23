import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBpSxmlO51mFQy6DJevm4HQLjsHFvhufng",
  authDomain: "cloud-morphix.firebaseapp.com",
  projectId: "cloud-morphix",
  storageBucket: "cloud-morphix.firebasestorage.app",
  messagingSenderId: "355808731437",
  appId: "1:355808731437:web:b7fe066165013bdebbf3a4",
  measurementId: "G-LKN71G6VC3"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
