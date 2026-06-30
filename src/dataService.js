import { getDatabase, ref, set as rtdbSet, remove as rtdbRemove } from "firebase/database";
import { db, firebaseConfigurado } from "./firebase.js";
import dbQueue from "./dbQueue.js";
import { COLECCION } from "./constants.js";

function requireConfigured() {
  if (!firebaseConfigurado || !db) {
    throw new Error("Firebase no está configurado");
  }
}

function getReference(path) {
  requireConfigured();
  return ref(getDatabase(), path);
}

export async function writePath(path, data) {
  try {
    const referencia = getReference(path);
    await rtdbSet(referencia, data);
    return { ok: true };
  } catch (error) {
    dbQueue.add({ path, action: "set", data });
    console.warn("writePath: escritura en cola por error:", path, error);
    return { ok: false, error };
  }
}

export async function removePath(path) {
  try {
    const referencia = getReference(path);
    await rtdbRemove(referencia);
    return { ok: true };
  } catch (error) {
    dbQueue.add({ path, action: "remove" });
    console.warn("removePath: eliminación en cola por error:", path, error);
    return { ok: false, error };
  }
}

export async function commitFullDocument(documentId, data) {
  return writePath(`${COLECCION}/${documentId}`, data);
}

export async function commitMovement(sectionId, movimientoId, movimientoSeguro) {
  return writePath(`${COLECCION}/${sectionId}/movimientos/${movimientoId}`, movimientoSeguro);
}

export async function commitDeleteMovement(sectionId, movimientoId) {
  return removePath(`${COLECCION}/${sectionId}/movimientos/${movimientoId}`);
}

export async function commitAuditEntry(entryId, entryData) {
  return writePath(`${COLECCION}/auditoria/${entryId}`, entryData);
}
