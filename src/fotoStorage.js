import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { storage, firebaseConfigurado } from "./firebase.js";

// ════════════════════════════════════════════════════════════════════════════
// Comprime una imagen en el navegador antes de subirla (más rápido, menos datos)
// ════════════════════════════════════════════════════════════════════════════
export function comprimirImagen(file, maxW = 1000, calidad = 0.75) { 
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
// Sube la foto real a Firebase Storage y retorna la URL pública de descarga
// ════════════════════════════════════════════════════════════════════════════
export async function subirFotoRemito(dataUrlBase64, idMovimiento) {
  if (!dataUrlBase64) return "";

  // Si por alguna razón la imagen ya es una URL web de Firebase, no la resubimos
  if (dataUrlBase64.startsWith("http")) return dataUrlBase64;

  try {
    // Creamos la referencia en la carpeta 'remitos' con el ID único del movimiento
    const storageRef = ref(storage, `remitos/${idMovimiento}_${Date.now()}.jpg`);
    
    // Subimos el string en formato 'data_url' (Base64)
    const snapshot = await uploadString(storageRef, dataUrlBase64, "data_url");
    
    // Obtenemos y retornamos la URL de descarga real
    const urlDescarga = await getDownloadURL(snapshot.ref);
    return urlDescarga;
  } catch (error) {
    console.error("Error crítico al subir la imagen a Firebase Storage:", error);
    return "";
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Elimina la foto de Firebase Storage si se borra el remito
// ════════════════════════════════════════════════════════════════════════════
export async function eliminarFotoRemito(url) {
  if (!url || !url.startsWith("http")) return;
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error al eliminar la foto de Storage:", error);
  }
}