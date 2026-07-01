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
// 2. Sube el Base64 a Google Drive sin CORS
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
    console.log("Subiendo foto a Google Drive...");

    const respuesta = await fetch(PUENTE_DRIVE_URL, {
      method: "POST",
      body: JSON.stringify({
        idMovimiento,
        mimeType,
        base64: base64Data,
      }),
    });

    if (!respuesta.ok) {
      console.error("Error en la respuesta:", respuesta.status);
      return "";
    }

    const resultado = await respuesta.json();

    if (resultado.status === "success" && resultado.url) {
      console.log("¡Foto guardada en Google Drive!", resultado.url);
      return resultado.url;
    }

    console.error("Error:", resultado.message || resultado);
    return "";
  } catch (error) {
    console.error("Error al subir:", error);
    return "";
  }
}

export async function eliminarFotoRemito(url) {
  if (!url) return { ok: false, message: "No hay URL" };

  try {
    const respuesta = await fetch(PUENTE_DRIVE_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "delete",
        url,
      }),
    });

    if (!respuesta.ok) {
      return { ok: false, message: "Error al eliminar" };
    }

    const resultado = await respuesta.json();
    return resultado.status === "success" 
      ? { ok: true, message: "Eliminado" }
      : { ok: false, message: resultado.message || "Error" };
  } catch (err) {
    console.error("Error al eliminar:", err);
    return { ok: false, message: String(err) };
  }
}