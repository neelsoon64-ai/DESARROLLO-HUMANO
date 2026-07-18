import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// ⚠️ PEGA AQUÍ TU CONFIGURACIÓN DE FIREBASE ⚠️
// Reemplaza este objeto de ejemplo con las credenciales que copiaste
// desde la consola de Firebase del "PASO 4.2" de las instrucciones.
const firebaseConfig = {
  apiKey: "AIzaSy... (reemplazar)",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// ========================================================================

export const firebaseConfigurado = !!(firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("(reemplazar)"));

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = firebaseConfigurado ? getDatabase(app) : null;
export const rtdb = db;
export const firestore = firebaseConfigurado ? getFirestore(app) : null;
export const storage = firebaseConfigurado ? getStorage(app) : null;