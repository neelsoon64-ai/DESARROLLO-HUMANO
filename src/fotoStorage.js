import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { storage, firebaseConfigurado } from "./firebase.js";

// ════════════════════════════════════════════════════════════════════════════
// Comprime una imagen en el navegador antes de subirla (más rápido, menos datos)
// ════════════════════════════════════════════════════════════════════════════
export function comprimirImagen(file, maxW = 1200, calidad = 0.82) {
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
      resolve(canvas.toDataURL("image/jpeg", calidad)); // <-- Devuelve el texto Base64 comprimido
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

// ════════════════════════════════════════════════════════════════════════════
// Sube una imagen (en formato dataURL base64). 
// ¡MODIFICADO!: Ahora salta directo el Storage y devuelve siempre el Base64 
// para guardarlo como texto en la Realtime Database de forma 100% gratuita.
// ════════════════════════════════════════════════════════════════════════════
export async function subirFotoRemito(dataUrlBase64, idMovimiento) {
  // 🔥 FORZAMOS EL SVALTO: Devolvemos el texto directo para guardarlo en la base de datos gratis
  return dataUrlBase64;
}

// ════════════════════════════════════════════════════════════════════════════
// Elimina una foto de Storage (Se mantiene la función para que no rompa la app,
// pero como no usamos Storage, no hace falta borrar nada de la nube)
// ════════════════════════════════════════════════════════════════════════════
export async function eliminarFotoRemito(url) {
  // Como las fotos ahora son texto dentro del remito, al borrar el movimiento 
  // de la base de datos la foto se elimina automáticamente con él.
  return;
}