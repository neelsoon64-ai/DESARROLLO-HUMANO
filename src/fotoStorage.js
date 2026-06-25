import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase.js";

export function generarPreviewDesdeArchivo(file) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(lector.error);
    lector.readAsDataURL(file);
  });
}

export async function subirFotoRemito(file, idMovimiento, indice) {
  if (!file) return "";
  const preview = await generarPreviewDesdeArchivo(file);

  if (!storage) {
    console.warn("Firebase Storage no disponible: usando preview base64.");
    return preview;
  }

  const nombreSeguro = file.name ? file.name.replace(/[^a-zA-Z0-9._-]/g, "_") : `foto-${indice}`;
  const ruta = `remitos/${idMovimiento}/${Date.now()}-${indice}-${nombreSeguro}`;
  const referencia = storageRef(storage, ruta);

  try {
    const resultado = await uploadBytes(referencia, file);
    return getDownloadURL(resultado.ref);
  } catch (error) {
    console.warn("No se pudo subir la foto a Firebase Storage, usando base64 como fallback.", error);
    return preview;
  }
}

export async function eliminarFotoRemito(url) {
  return;
}