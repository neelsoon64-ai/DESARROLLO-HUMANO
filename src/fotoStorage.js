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

const PUENTE_DRIVE_URL = import.meta.env.VITE_GOOGLE_DRIVE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbwQ28gG7-dsc2ivTQ-yeg3L-SgbLnLiokQ7SEQpu5u2rGLtmy8AKjq2qkXTG0B9bKRJ/exec";

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
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        idMovimiento,
        mimeType,
        base64: base64Data,
      }),
    });

    // Con mode: "no-cors", no podemos leer la respuesta, pero la foto se guarda
    // Si llegó aquí sin error, asumimos que fue exitoso
    console.log("¡Petición enviada a Google Drive! Foto guardándose...");
    return `https://drive.google.com/drive/folders/1T8x3hAqadrxfbV8m5qGFujykTtwT5cYE?usp=sharing`;
  } catch (error) {
    console.error("Error de red o CORS al conectar con Google Drive:", error);
    return "";
  }
}

export async function eliminarFotoRemito(url) {
  if (!url) return { ok: false, message: "No hay URL" };

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

  const URL_PUENTE_DRIVE = PUENTE_DRIVE_URL;

  try {
    const payload = { action: "delete", url };
    if (fileId) payload.fileId = fileId;

    const resp = await fetch(URL_PUENTE_DRIVE, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json;charset=utf-8" },
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