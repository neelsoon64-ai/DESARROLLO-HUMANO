import { getDatabase, ref, set as rtdbSet } from "firebase/database";
import { db, firebaseConfigurado } from "./firebase.js";

const STORAGE_KEY = "rtdb_write_queue";

function loadQueue() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveQueue(q) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(q));
    window.dispatchEvent(new CustomEvent("dbQueueUpdated", { detail: { count: q.length } }));
  } catch (e) {
    console.warn("No se pudo guardar la cola localmente:", e);
  }
}

async function tryWrite(item) {
  if (!firebaseConfigurado || !db) throw new Error("Firebase no configurado");
  const database = getDatabase();
  const referencia = ref(database, item.path);
  await rtdbSet(referencia, item.data);
}

const Queue = {
  add(item) {
    const q = loadQueue();
    q.push({ ...item, createdAt: new Date().toISOString(), attempts: 0 });
    saveQueue(q);
    return q.length;
  },
  list() {
    return loadQueue();
  },
  clear() {
    saveQueue([]);
  },
  async processOnce() {
    const q = loadQueue();
    if (!q.length) return;
    const remaining = [];
    for (const it of q) {
      try {
        await tryWrite(it);
        console.log("dbQueue: escritura exitosa:", it.path);
      } catch (err) {
        it.attempts = (it.attempts || 0) + 1;
        it.lastError = String(err);
        console.warn("dbQueue: fallo al escribir, se reintentará:", it.path, err);
        // limit attempts to avoid infinite retries
        if (it.attempts < 10) remaining.push(it);
        else console.error("dbQueue: descartando item tras 10 intentos:", it.path);
      }
    }
    saveQueue(remaining);
  },
  start(intervalMs = 10000) {
    if (this._interval) return;
    this._interval = setInterval(() => this.processOnce(), intervalMs);
    // procesar inmediatamente
    this.processOnce().catch((e) => console.warn("dbQueue start error:", e));
  },
  stop() {
    if (this._interval) clearInterval(this._interval);
    this._interval = null;
  },
  count() {
    return loadQueue().length;
  }
};

// Auto-start en entorno de navegador
if (typeof window !== "undefined") {
  try {
    Queue.start(10000);
  } catch (e) {
    console.warn("dbQueue: no se pudo iniciar:", e);
  }
}

export default Queue;
