import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { storage, firebaseConfigurado } from "./firebase.js";

// ════════════════════════════════════════════════════════════════════════════
// Comprime una imagen en el navegador antes de subirla (más rápido, menos datos)
// ════════════════════════════════════════════════════════════════════════════
export function comprimirImagen(file, maxW = 1000, calidad = 0.75) { 
  // Nota: Bajamos un pelito la calidad (de 0.82 a 0.75) y el ancho max (a 1000px) 
  // para que al subir MÚLTIPLES fotos, el texto no sea tan gigante y Firebase no te lo rechace.
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxW) {
        height = Math.round((height * maxW) / width);
        width = maxW;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", calidad)); 
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

// ════════════════════════════════════════════════════════════════════════════
// ¡NUEVA FUNCIÓN!: Recibe una lista de imágenes en Base64 y las devuelve 
// listas para guardarse como array en la Realtime Database de forma gratuita.
// ════════════════════════════════════════════════════════════════════════════
export async function subirFotoRemito(dataUrlsBase64, idMovimiento) {
  // Si le pasamos un array de fotos, lo devuelve derecho. 
  // Si viene una sola foto como string, la metemos en una lista para mantener el orden.
  if (Array.isArray(dataUrlsBase64)) {
    return dataUrlsBase64;
  }
  return dataUrlsBase64 ? [dataUrlsBase64] : [];
}

export async function eliminarFotoRemito(url) {
  return;
}