import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBBVQ-n7UaegnUv2PDdiZ9zN3CZgETrp0U",
  authDomain: "desarrollo-humano-af808.firebaseapp.com",
  databaseURL: "https://desarrollo-humano-af808-default-rtdb.firebaseio.com",
  projectId: "desarrollo-humano-af808",
  storageBucket: "desarrollo-humano-af808.firebasestorage.app",
  messagingSenderId: "812070980942",
  appId: "1:812070980942:web:bc3400184a3a32610fe21f"
};

// Validamos si la configuración completa de Firebase está cargada
export const firebaseConfigurado = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.databaseURL,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId
].every(Boolean);

// Inicialización segura de la App
const app = firebaseConfigurado ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]) : null;

// --- EXPORTACIONES DE INSTANCIAS ---

// 1. Mantenemos 'db' como Realtime Database para que no rompa tus componentes/hooks existentes
export const db = firebaseConfigurado ? getDatabase(app) : null; 

// 2. Dejamos 'rtdb' como alias por compatibilidad
export const rtdb = db; 

// 3. Exportamos Firestore por separado si necesitas usarlo en el futuro
export const firestore = firebaseConfigurado ? getFirestore(app) : null; 

// 4. Almacenamiento de archivos/fotos
export const storage = firebaseConfigurado ? getStorage(app) : null;

// 5. Autenticación mínima: sign-in anónimo para que las reglas que requieren
// request.auth != null permitan escrituras básicas desde clientes.
export const auth = firebaseConfigurado ? getAuth(app) : null;

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