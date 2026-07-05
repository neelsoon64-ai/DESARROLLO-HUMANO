import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyBBVQ-n7UaegnUv2PDdiZ9zN3CZgETrp0U",

  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "desarrollo-humano-af808.firebaseapp.com",

  // ✅ CORREGIDO: Ahora tiene las comillas correspondientes y sin la comilla doble corrupta al final
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    "https://desarrollo-humano-af808-default-rtdb.firebaseio.com",

  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    "desarrollo-humano-af808",

  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "desarrollo-humano-af808.firebasestorage.app",

  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    "812070980942",

  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:812070980942:web:bc3400184a3a32610fe21f",
};

export const firebaseConfigurado = !!firebaseConfig.apiKey;

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = firebaseConfigurado ? getDatabase(app) : null;
export const rtdb = db;
export const firestore = firebaseConfigurado ? getFirestore(app) : null;
export const storage = firebaseConfigurado ? getStorage(app) : null;