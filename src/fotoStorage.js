import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
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
  if (!storage) {
    return generarPreviewDesdeArchivo(file);
  }

  const nombreSeguro = file.name ? file.name.replace(/[^a-zA-Z0-9._-]/g, "_") : `foto-${indice}`;
  const ruta = `remitos/${idMovimiento}/${Date.now()}-${indice}-${nombreSeguro}`;
  const referencia = storageRef(storage, ruta);
  const resultado = await uploadBytes(referencia, file);
  return getDownloadURL(resultado.ref);
}

export async function eliminarFotoRemito(url) {
  return;
}