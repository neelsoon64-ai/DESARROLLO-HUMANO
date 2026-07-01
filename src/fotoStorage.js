import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase.js";

// ════════════════════════════════════════════════════════════════════════════
// 1. Genera la vista previa temporal en Base64 para la interfaz del modal
// ════════════════════════════════════════════════════════════════════════════
export function generarPreviewDesdeArchivo(file) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(lector.error);
    lector.readAsDataURL(file);
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 2. Sube la foto a Firebase Storage (sin problemas de CORS)
// ════════════════════════════════════════════════════════════════════════════
export async function subirFotoRemito(dataUrlBase64, idMovimiento = "remito") {
  if (!dataUrlBase64) return "";

  // Si ya es una URL pública, devolverla tal cual
  if (typeof dataUrlBase64 === "string" && dataUrlBase64.startsWith("http")) {
    return dataUrlBase64;
  }

  if (!storage) {
    console.error("Firebase Storage no está configurado");
    return "";
  }

  try {
    let blob;

    // Convertir data URL a Blob
    if (typeof dataUrlBase64 === "string" && dataUrlBase64.startsWith("data:")) {
      const arr = dataUrlBase64.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      const n = bstr.length;
      const u8arr = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i);
      }
      blob = new Blob([u8arr], { type: mime });
    } else if (dataUrlBase64 instanceof Blob || dataUrlBase64 instanceof File) {
      blob = dataUrlBase64;
    } else {
      console.warn("Tipo de dato no soportado");
      return "";
    }

    // Crear nombre único
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 7);
    const nombreArchivo = `fotos_remitos/${idMovimiento}_${timestamp}_${random}.jpg`;

    console.log(`Subiendo foto a Firebase Storage: ${nombreArchivo}`);

    // Subir a Firebase
    const storageRef = ref(storage, nombreArchivo);
    await uploadBytes(storageRef, blob);

    // Obtener URL pública
    const urlPublica = await getDownloadURL(storageRef);
    console.log("¡Foto guardada en Firebase Storage!", urlPublica);

    return urlPublica;
  } catch (error) {
    console.error("Error al subir foto:", error);
    return "";
  }
}

export async function eliminarFotoRemito(url) {
  if (!url) return { ok: false, message: "No hay URL" };

  if (!storage) {
    console.error("Firebase Storage no está configurado");
    return { ok: false, message: "Storage no configurado" };
  }

  try {
    // Extraer el path del archivo de la URL de Firebase
    const urlObj = new URL(url);
    const pathStart = urlObj.pathname.indexOf("/o/") + 3;
    const pathEnd = urlObj.pathname.indexOf("?");
    const encodedPath = urlObj.pathname.substring(pathStart, pathEnd);
    const filePath = decodeURIComponent(encodedPath);

    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);

    console.log("Foto eliminada de Firebase Storage");
    return { ok: true, message: "Foto eliminada" };
  } catch (err) {
    console.error("Error al eliminar foto:", err);
    return { ok: false, message: String(err) };
  }
}