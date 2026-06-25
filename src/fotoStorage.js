import { firebaseConfigurado } from "./firebase.js";

// ════════════════════════════════════════════════════════════════════════════
// Compresión ULTRA AGRESIVA para forzar el guardado en la Realtime Database
// ════════════════════════════════════════════════════════════════════════════
export async function comprimirImagen(file, maxW = 1200, calidad = 0.8) {
  // Conservamos la máxima legibilidad posible para fotos de remitos.
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  }).catch(() => null);

  if (!dataUrl || typeof dataUrl !== "string") return null;

  // Si la imagen ya es pequeña, mantenemos su calidad original.
  if (file.size <= 1000000) {
    return dataUrl;
  }

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
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
      }
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", calidad));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(dataUrl);
    };
    img.src = url;
  });
}

// ════════════════════════════════════════════════════════════════════════════
// Retorna el string listo para guardarse en el remito
// ════════════════════════════════════════════════════════════════════════════
export async function subirFotoRemito(dataUrlBase64, idMovimiento) {
  if (!dataUrlBase64) return "";
  return dataUrlBase64;
}

export async function eliminarFotoRemito(url) {
  return;
}