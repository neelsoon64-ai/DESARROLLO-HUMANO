import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || undefined, // <-- Si viene vacío o mal, le pasamos undefined para que no rompa
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validamos si las variables clave están presentes
export const firebaseConfigurado = !!import.meta.env.VITE_FIREBASE_PROJECT_ID;

// Inicialización segura para desarrollo
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Exportamos las instancias asegurando que no rompan la app
export const db = firebaseConfigurado ? getFirestore(app) : null;      

// Solo inicializamos Realtime Database si realmente la URL existe en el entorno
export const rtdb = (firebaseConfigurado && import.meta.env.VITE_FIREBASE_DATABASE_URL) ? getDatabase(app) : null;    

export const storage = firebaseConfigurado ? getStorage(app) : null;