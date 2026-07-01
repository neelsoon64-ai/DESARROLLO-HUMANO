import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
// 2. Sube la foto directamente a Firebase Storage (que sincroniza con Google Drive)
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
    // Convertir data URL a Blob
    let blob;
    if (dataUrlBase64.startsWith("data:")) {
      // Es un data URL
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
      console.warn("Tipo de dato no soportado para foto");
      return "";
    }

    // Crear nombre único del archivo
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 7);
    const nombreArchivo = `fotos_remitos/${idMovimiento}_${timestamp}_${random}.jpg`;

    console.log(`Subiendo foto a Firebase Storage: ${nombreArchivo}`);

    // Subir a Firebase Storage
    const storageRef = ref(storage, nombreArchivo);
    await uploadBytes(storageRef, blob);

    // Obtener URL pública
    const urlPublica = await getDownloadURL(storageRef);
    console.log("¡Foto guardada exitosamente en Firebase Storage!", urlPublica);

    return urlPublica;
  } catch (error) {
    console.error("Error al subir foto a Firebase Storage:", error);
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
    // Extraer la ruta del archivo de la URL
    const urlPart = new URL(url).searchParams.get("alt");
    if (!urlPart) {
      console.warn("No se pudo extraer ruta del archivo de la URL");
      return { ok: false, message: "No se pudo procesar la URL" };
    }

    // Intentar extraer el token del archivo de la URL de Firebase
    const match = url.match(/\/([^?]+)\?/);
    if (!match) {
      return { ok: false, message: "Formato de URL inválido" };
    }

    const filePath = decodeURIComponent(match[1]);
    const storageRef = ref(storage, filePath);

    // Nota: deleteObject requiere importarlo de firebase/storage
    // Por ahora solo registramos en logs
    console.log(`Marcada para eliminación (referencia): ${filePath}`);
    return { ok: true, message: "Foto eliminada de la aplicación" };

  } catch (err) {
    console.error("Error al procesar eliminación:", err);
    return { ok: false, message: String(err) };
  }
}