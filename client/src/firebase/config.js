// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB2nu1-p-5K_tgRv5Lf_qz-sbqXJsKqmpI",
  authDomain: "healthtrack-9e36c.firebaseapp.com",
  databaseURL: "https://healthtrack-9e36c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "healthtrack-9e36c",
  storageBucket: "healthtrack-9e36c.firebasestorage.app",
  messagingSenderId: "1042087950444",
  appId: "1:1042087950444:web:86cde0ce225628a8dfc049",
  measurementId: "G-4HWLRPEN7Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);