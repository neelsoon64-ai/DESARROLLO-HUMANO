// ════════════════════════════════════════════════════════════════════════════
// 1. Genera la vista previa temporal para la interfaz del modal
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
// 2. Comprime la imagen antes de mandarla a Google Drive para que vuele
// ════════════════════════════════════════════════════════════════════════════
export function comprimirImagen(file, maxW = 800, calidad = 0.70) { 
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
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
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
// 3. Sube la foto real a tu Google Drive y te devuelve la URL definitiva
// ════════════════════════════════════════════════════════════════════════════
export async function subirFotoRemito(file, idMovimiento = "remito") {
  if (!file) return "";
  
  // Si por algún motivo ya nos pasan una URL web de Drive, la dejamos pasar directo
  if (typeof file === "string" && file.startsWith("http")) return file;

  // URL del puente de Google Apps Script que configuraste impecable
  const URL_PUENTE_DRIVE = "https://script.google.com/macros/s/AKfycbyOOOlVQwsAQLsKnYtWL2OA7MroSjOstUkqT9ERSDCNe3yN23uyE5mAhIKxR0rzbTI0/exec";

  try {
    // Primero comprimimos el archivo para no saturar la red
    const base64Comprimido = await comprimirImagen(file);
    if (!base64Comprimido) return "";

    // Enviamos el paquete JSON seguro hacia Google Drive
    const respuesta = await fetch(URL_PUENTE_DRIVE, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        idMovimiento: idMovimiento,
        mimeType: "image/jpeg",
        base64: base64Comprimido
      })
    });

    const resultado = await respuesta.json();

    if (resultado.status === "success") {
      console.log("¡Imagen alojada con éxito en Google Drive!");
      return resultado.url; // Retorna el enlace real de la nube (Ej: https://drive.google.com/...)
    } else {
      console.error("Google rebotó la subida:", resultado.message);
      return "";
    }
  } catch (error) {
    console.error("Error crítico de conexión con el puente de Drive:", error);
    return "";
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 4. Limpieza (Las fotos se mantienen en el historial de tu Drive)
// ════════════════════════════════════════════════════════════════════════════
export async function eliminarFotoRemito(url) {
  return;
}