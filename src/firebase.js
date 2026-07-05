import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBBVQ-n7UaegnUv2PDdiZ9zN3CZgETrp0U",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "desarrollo-humano-af808.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://desarrollo-humano-af808-default-rtdb.firebaseio.com/"
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "desarrollo-humano-af808",
  
  // ─── 🛠️ CORRECCIÓN: Si la variable viene vacía de Vercel/Local, le clava el bucket por defecto
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "desarrollo-humano-af808.appspot.com",
  
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "812070980942",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:812070980942:web:bc3400184a3a32610fe21f"
};

// Validamos si la configuración básica de Firebase está cargada
export const firebaseConfigurado = !!firebaseConfig.apiKey;

// Inicialización segura de la App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// --- EXPORTACIONES DE INSTANCIAS ---

// 1. Mantenemos 'db' como Realtime Database para que no rompa tus componentes/hooks existentes
export const db = firebaseConfigurado ? getDatabase(app) : null; 

// 2. Dejamos 'rtdb' como alias por compatibilidad
export const rtdb = db; 

// 3. Exportamos Firestore por separado si necesitas usarlo en el futuro
export const firestore = firebaseConfigurado ? getFirestore(app) : null; 

// 4. Almacenamiento de archivos/fotos
export const storage = firebaseConfigurado ? getStorage(app) : null;