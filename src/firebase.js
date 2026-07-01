import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: String(import.meta.env.VITE_FIREBASE_API_KEY || "").trim(),
  authDomain: String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "").trim(),
  databaseURL: String(import.meta.env.VITE_FIREBASE_DATABASE_URL || "").trim(),
  projectId: String(import.meta.env.VITE_FIREBASE_PROJECT_ID || "").trim(),
  storageBucket: String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "").trim(),
  messagingSenderId: String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "").trim(),
  appId: String(import.meta.env.VITE_FIREBASE_APP_ID || "").trim(),
};

const firebaseAppCheckKey = String(import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY || "").trim();

const requiredFirebaseKeys = {
  VITE_FIREBASE_API_KEY: firebaseConfig.apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  VITE_FIREBASE_DATABASE_URL: firebaseConfig.databaseURL,
  VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  VITE_FIREBASE_STORAGE_BUCKET: firebaseConfig.storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId,
  VITE_FIREBASE_APP_ID: firebaseConfig.appId,
};

const missingFirebaseKeys = Object.entries(requiredFirebaseKeys)
  .filter(([, value]) => !value)
  .map(([key]) => key);

// Validamos si la configuración completa de Firebase está cargada.
// App Check es opcional, pero la app puede funcionar sin él en desarrollo local.
export const firebaseConfigurado = missingFirebaseKeys.length === 0;

if (!firebaseConfigurado) {
  console.warn(
    "Firebase no está configurado correctamente: faltan variables de entorno",
    missingFirebaseKeys,
    requiredFirebaseKeys
  );
} else {
  console.log("Firebase configurado correctamente", {
    ...requiredFirebaseKeys,
    VITE_FIREBASE_APP_CHECK_SITE_KEY: !!firebaseAppCheckKey,
  });
}

// Inicialización segura de la App
const app = firebaseConfigurado ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]) : null;

// --- EXPORTACIONES DE INSTANCIAS ---

export const db = firebaseConfigurado && app ? getDatabase(app) : null;
export const rtdb = db;
export const firestore = firebaseConfigurado && app ? getFirestore(app) : null;
export const storage = firebaseConfigurado && app ? getStorage(app) : null;
export const auth = firebaseConfigurado && app ? getAuth(app) : null;

if (firebaseConfigurado && app && firebaseAppCheckKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(firebaseAppCheckKey),
      isTokenAutoRefreshEnabled: true,
    });
    console.log("Firebase App Check configurado");
  } catch (err) {
    console.warn("No se pudo inicializar Firebase App Check:", err);
  }
}

if (firebaseConfigurado && auth) {
  try {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Firebase Auth: usuario activo ->", user.uid, user.isAnonymous ? "(anónimo)" : "");
      } else {
        console.log("Firebase Auth: sin usuario autenticado");
      }
    });

    if (!auth.currentUser) {
      signInAnonymously(auth)
        .then(() => console.log("Firebase Auth: sesión anónima iniciada"))
        .catch((err) => console.warn("Firebase Auth: no se pudo iniciar sesión anónima:", err));
    }
  } catch (err) {
    console.warn("Error inicializando Auth anónimo:", err);
  }
}