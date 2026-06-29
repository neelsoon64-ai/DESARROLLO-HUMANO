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
      return resultado.url; // Retorna el enlace directo uc?export=view...
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
  if (!url) return { ok: false, message: "No hay URL" };

  // Si la URL ya es pública, intentamos extraer un posible fileId de Drive
  // Patrones comunes: /d/FILEID/ o id=FILEID o /open?id=FILEID
  const patterns = [
    /\/d\/([a-zA-Z0-9_-]{10,})\//,
    /[?&]id=([a-zA-Z0-9_-]{10,})/,
    /open\?id=([a-zA-Z0-9_-]{10,})/,
  ];

  let fileId = null;
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) {
      fileId = m[1];
      break;
    }
  }

  const URL_PUENTE_DRIVE = "https://script.google.com/macros/s/AKfycbyOOOlVQwsAQLsKnYtWL2OA7MroSjOstUkqT9ERSDCNe3yN23uyE5mAhIKxR0rzbTI0/exec";

  try {
    const payload = { action: "delete", url };
    if (fileId) payload.fileId = fileId;

    const resp = await fetch(URL_PUENTE_DRIVE, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let resultado = {};
    try { resultado = JSON.parse(text); } catch (e) { resultado = { status: "error", message: text }; }

    if (resultado.status === "success") {
      return { ok: true, message: resultado.message || "Eliminado" };
    }

    return { ok: false, message: resultado.message || "Error desconocido" };
  } catch (err) {
    console.error("Error al pedir eliminación a Apps Script:", err);
    return { ok: false, message: String(err) };
  }
}