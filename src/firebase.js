import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const firebaseAppCheckKey = import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY;

// Validamos si la configuración completa de Firebase está cargada.
// App Check es opcional, pero la app puede funcionar sin él en desarrollo local.
export const firebaseConfigurado = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.databaseURL,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
].every(Boolean);

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