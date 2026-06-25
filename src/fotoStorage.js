import { firebaseConfigurado } from "./firebase.js";

// ════════════════════════════════════════════════════════════════════════════
// Comprime la imagen de forma agresiva para que entre liviana en la RTDB (Gratis)
// ════════════════════════════════════════════════════════════════════════════
export function comprimirImagen(file, maxW = 500, calidad = 0.5) { 
  // Bajamos el ancho máximo a 500px y la calidad a 0.5 para achicar el Base64 al extremo
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
      
      // Exportamos como un JPEG ultra comprimido
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
// Solución sin Storage: Retorna la cadena Base64 limpia para inyectar en el remito
// ════════════════════════════════════════════════════════════════════════════
export async function subirFotoRemito(dataUrlBase64, idMovimiento) {
  if (!dataUrlBase64) return "";
  
  // En vez de usar el Storage bloqueado, devolvemos la imagen como texto plano optimizado.
  // Esto viaja dentro del objeto del remito directo a tu Realtime Database que sí funciona.
  return dataUrlBase64;
}

// ════════════════════════════════════════════════════════════════════════════
// No requiere limpieza en Storage externo
// ════════════════════════════════════════════════════════════════════════════
export async function eliminarFotoRemito(url) {
  return;
}