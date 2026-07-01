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

const PUENTE_DRIVE_URL = import.meta.env.VITE_GOOGLE_DRIVE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbzl3eDGV--gvrB1NFJpdio0W2aHSBH9GhKjtntUMHn3bu3nVD2v6OrbspoKvNy9omTK/exec";

function extraerBase64DesdeDataUrl(dataUrl) {
  const match = /^data:(image\/[^;]+);base64,(.*)$/i.exec(dataUrl);
  if (!match) return null;
  return {
    mimeType: match[1],
    base64: match[2],
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 2. Sube el Base64 procesado directamente a tu Google Drive
// ════════════════════════════════════════════════════════════════════════════
export async function subirFotoRemito(dataUrlBase64, idMovimiento = "remito") {
  if (!dataUrlBase64) return "";

  if (typeof dataUrlBase64 === "string" && dataUrlBase64.startsWith("http")) {
    return dataUrlBase64;
  }

  let mimeType = "image/jpeg";
  let base64Data = "";

  if (typeof dataUrlBase64 === "string") {
    const extraido = extraerBase64DesdeDataUrl(dataUrlBase64);
    if (extraido) {
      mimeType = extraido.mimeType;
      base64Data = extraido.base64;
    } else {
      base64Data = dataUrlBase64;
    }
  } else if (dataUrlBase64 instanceof Blob || dataUrlBase64 instanceof File) {
    base64Data = await new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => {
        const resultado = lector.result;
        const extraido = extraerBase64DesdeDataUrl(resultado);
        if (extraido) {
          mimeType = extraido.mimeType;
          resolve(extraido.base64);
        } else {
          reject(new Error("No se pudo extraer Base64 del archivo"));
        }
      };
      lector.onerror = () => reject(lector.error);
      lector.readAsDataURL(dataUrlBase64);
    });
  } else {
    console.warn("subirFotoRemito recibió un tipo no soportado:", typeof dataUrlBase64);
    return "";
  }

  if (!base64Data) {
    console.warn("subirFotoRemito: no hay datos Base64 válidos");
    return "";
  }

  try {
    console.log("Enviando petición POST a Google Apps Script...");

    const respuesta = await fetch(PUENTE_DRIVE_URL, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify({
        idMovimiento,
        mimeType,
        base64: base64Data,
      }),
    });

    const textoRespuesta = await respuesta.text();
    let resultado = {};
    try {
      resultado = JSON.parse(textoRespuesta);
    } catch (err) {
      console.error("subirFotoRemito: respuesta inválida de servidor:", textoRespuesta, err);
      return "";
    }

    if (resultado.status === "success" && resultado.url) {
      console.log("¡Foto guardada exitosamente en Google Drive!", resultado.url);
      return resultado.url;
    }

    console.error("El script de Google Apps Script devolvió un error:", resultado.message || resultado);
    return "";
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

  const URL_PUENTE_DRIVE = import.meta.env.VITE_GOOGLE_DRIVE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbzl3eDGV--gvrB1NFJpdio0W2aHSBH9GhKjtntUMHn3bu3nVD2v6OrbspoKvNy9omTK/exec";

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