import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// ⚠️ PEGA AQUÍ TU CONFIGURACIÓN DE FIREBASE ⚠️
// Reemplaza este objeto de ejemplo con las credenciales que copiaste
// desde la consola de Firebase del "PASO 4.2" de las instrucciones.
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "inventario-mdh.firebaseapp.com",
  projectId: "inventario-mdh",
  storageBucket: "inventario-mdh.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  databaseURL: "https://inventario-mdh.firebaseio.com"
};

// ========================================================================

export const firebaseConfigurado = !!(firebaseConfig.apiKey && firebaseConfig.apiKey !== "AIzaSy...");

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = firebaseConfigurado ? getDatabase(app) : null;
export const rtdb = db;
export const firestore = firebaseConfigurado ? getFirestore(app) : null;
export const storage = firebaseConfigurado ? getStorage(app) : null;