import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";
import serviceAccount from "../service-account-key.json" with { type: "json" };

dotenv.config();

initializeApp({
  credential: cert(serviceAccount),
});

// Initialize Firestore
const db = getFirestore();

export { db };