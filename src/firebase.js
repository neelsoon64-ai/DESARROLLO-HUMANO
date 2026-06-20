import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore"; // <-- Agregamos Firestore para solucionar el error

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validamos si la URL de la base de datos está presente para activar el modo online
export const firebaseConfigurado = !!import.meta.env.VITE_FIREBASE_DATABASE_URL;

// Inicialización segura para desarrollo
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Exportamos todas las instancias requeridas por tus componentes y hooks
export const db = firebaseConfigurado ? getFirestore(app) : null;      // <-- 'db' pasa a ser Firestore para useSharedState
export const rtdb = firebaseConfigurado ? getDatabase(app) : null;    // Por si usás Realtime en otra parte
export const storage = firebaseConfigurado ? getStorage(app) : null;  // Para fotoStorage.js