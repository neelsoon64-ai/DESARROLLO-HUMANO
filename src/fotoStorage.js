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
// 2. Sube el Base64 procesado directamente a tu Google Drive
// ════════════════════════════════════════════════════════════════════════════
export async function subirFotoRemito(dataUrlBase64, idMovimiento = "remito") {
  if (!dataUrlBase64) return "";
  
  // Si por alguna razón ya es una URL de internet, la dejamos pasar intacta
  if (dataUrlBase64.startsWith("http")) return dataUrlBase64;

  // URL de tu aplicación web de Google Apps Script (¡Ya integrada!)
  const URL_PUENTE_DRIVE = "https://script.google.com/macros/s/AKfycbyOOOlVQwsAQLsKnYtWL2OA7MroSjOstUkqT9ERSDCNe3yN23uyE5mAhIKxR0rzbTI0/exec";

  try {
    console.log("Enviando petición POST a Google Apps Script...");
    
    const respuesta = await fetch(URL_PUENTE_DRIVE, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        idMovimiento: idMovimiento,
        mimeType: "image/jpeg",
        base64: dataUrlBase64 
      })
    });

    const textoRespuesta = await respuesta.text();
    const resultado = JSON.parse(textoRespuesta);

    if (resultado.status === "success") {
      console.log("¡Foto guardada exitosamente en Google Drive!", resultado.url);
      
      // ─── 🛡️ FILTRO DE ALTO RENDIMIENTO PARA EVITAR ENLACES ROTOS ───
      // Extraemos el ID del archivo que devuelve el script para armar el link inmune al bloqueo
      try {
        const match = resultado.url.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]{25,})/);
        if (match && match[1]) {
          const idImagen = match[1];
          // Retornamos el endpoint del CDN global de Google (Renderizado instantáneo)
          return `https://lh3.googleusercontent.com/d/${idImagen}`;
        }
      } catch (e) {
        console.warn("No se pudo formatear la URL de Drive, se usará la original:", e);
      }

      return resultado.url; 
    } else {
      console.error("El script de Google Apps Script devolvió un error:", resultado.message);
      return "";
    }
  } catch (error) {
    console.error("Error de red o CORS al conectar con Google Drive:", error);
    return "";
  }
}

export async function eliminarFotoRemito(url) {
  return;
}