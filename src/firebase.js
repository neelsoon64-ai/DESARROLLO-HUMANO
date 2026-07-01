import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const stripEnvValue = (value) => {
  if (typeof value !== "string") return value;
  return value.replace(/^['"]+|['"]+$/g, "").trim();
};

const firebaseConfig = {
  apiKey: stripEnvValue(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: stripEnvValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  databaseURL: stripEnvValue(import.meta.env.VITE_FIREBASE_DATABASE_URL),
  projectId: stripEnvValue(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: stripEnvValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: stripEnvValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: stripEnvValue(import.meta.env.VITE_FIREBASE_APP_ID),
};

export const firebaseConfigurado = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.databaseURL,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
].every(Boolean);

const app = firebaseConfigurado ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]) : null;

export const db = firebaseConfigurado && app ? getDatabase(app) : null;
export const storage = firebaseConfigurado && app ? getStorage(app) : null;
export default app;