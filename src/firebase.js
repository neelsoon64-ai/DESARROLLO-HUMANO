import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// ⚠️ PEGA AQUÍ TU CONFIGURACIÓN DE FIREBASE ⚠️
// Reemplaza este objeto de ejemplo con las credenciales que copiaste
// desde la consola de Firebase del "PASO 4.2" de las instrucciones.
const firebaseConfig = {
  apiKey: "AIzaSyBBVQ-n7UaegnUv2PDdiZ9zN3CZgETrp0U",
  authDomain: "desarrollo-humano-af808.firebaseapp.com",
  projectId: "desarrollo-humano-af808",
  storageBucket: "desarrollo-humano-af808.firebasestorage.app",
  messagingSenderId: "812070980942",
  appId: "1:812070980942:web:bc3400184a3a32610fe21f"
};

// ========================================================================

export const firebaseConfigurado = !!(firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("(reemplazar)"));

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = firebaseConfigurado ? getDatabase(app) : null;
export const rtdb = db;
export const firestore = firebaseConfigurado ? getFirestore(app) : null;
export const storage = firebaseConfigurado ? getStorage(app) : null;