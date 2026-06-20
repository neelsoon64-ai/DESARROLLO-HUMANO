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
// Sube una imagen (en formato dataURL base64) a Firebase Storage y devuelve la
// URL pública para guardar en el movimiento. Si Firebase no está configurado,
// devuelve el propio base64 como fallback (funciona local, sin sync entre dispositivos).
// ════════════════════════════════════════════════════════════════════════════
export async function subirFotoRemito(dataUrlBase64, idMovimiento) {
  if (!firebaseConfigurado) {
    // Fallback local: guarda el base64 directo (no recomendado para uso multi-dispositivo)
    return dataUrlBase64;
  }
  const fotoRef = ref(storage, `remitos/${idMovimiento}-${Date.now()}.jpg`);
  await uploadString(fotoRef, dataUrlBase64, "data_url");
  const url = await getDownloadURL(fotoRef);
  return url;
}

// ════════════════════════════════════════════════════════════════════════════
// Elimina una foto de Storage a partir de su URL pública (al borrar un movimiento)
// ════════════════════════════════════════════════════════════════════════════
export async function eliminarFotoRemito(url) {
  if (!firebaseConfigurado || !url || !url.startsWith("https://firebasestorage")) return;
  try {
    const fotoRef = ref(storage, url);
    await deleteObject(fotoRef);
  } catch (err) {
    // Si ya no existe o falla, no es crítico
    console.warn("No se pudo eliminar la foto de Storage:", err.message);
  }
}
