import { firebaseConfigurado } from "./firebase.js";

// ════════════════════════════════════════════════════════════════════════════
// Compresión ULTRA AGRESIVA para forzar el guardado en la Realtime Database
// ════════════════════════════════════════════════════════════════════════════
export function comprimirImagen(file, maxW = 320, calidad = 0.3) { 
  // Bajamos a 320px de ancho y 0.3 de calidad. 
  // Esto genera una miniatura de entre 10KB y 20KB que Firebase acepta al toque de forma gratuita.
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
      // Forzamos fondo blanco por si la imagen tiene transparencias (PNG) y reducir más el peso
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      // Exportamos en calidad baja para asegurar que entre en el nodo
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
// Retorna el string ultra-comprimido listo para guardarse en el remito
// ════════════════════════════════════════════════════════════════════════════
export async function subirFotoRemito(dataUrlBase64, idMovimiento) {
  if (!dataUrlBase64) return "";
  return dataUrlBase64;
}

export async function eliminarFotoRemito(url) {
  return;
}