// ════════════════════════════════════════════════════════════════════════════
// Genera vista previa
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
// Comprime siempre a JPEG
// ════════════════════════════════════════════════════════════════════════════
async function comprimirImagen(
  dataUrl,
  maxWidth = 800,
  maxHeight = 600,
  calidad = 0.7
) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const comprimido = canvas.toDataURL("image/jpeg", calidad);
        resolve(comprimido);
      } catch (e) {
        reject(e);
      }
    };

    img.onerror = reject;
    img.src = dataUrl;
  });
}

const PUENTE_DRIVE_URL =
  import.meta.env.VITE_GOOGLE_DRIVE_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbwQ28gG7-dsc2ivTQ-yeg3L-SgbLnLiokQ7SEQpu5u2rGLtmy8AKjq2qkXTG0B9bKRJ/exec";

function extraerBase64DesdeDataUrl(dataUrl) {
  const match = /^data:(image\/[^;]+);base64,(.*)$/i.exec(dataUrl);

  if (!match) return null;

  return {
    mimeType: match[1],
    base64: match[2],
  };
}

// ════════════════════════════════════════════════════════════════════════════
// Subir foto
// ════════════════════════════════════════════════════════════════════════════
export async function subirFotoRemito(
  dataUrlBase64,
  idMovimiento = "remito"
) {
  try {
    if (!dataUrlBase64) return "";

    if (
      typeof dataUrlBase64 === "string" &&
      dataUrlBase64.startsWith("http")
    ) {
      return dataUrlBase64;
    }

    let dataUrl = "";

    if (typeof dataUrlBase64 === "string") {
      dataUrl = dataUrlBase64;
    } else {
      dataUrl = await new Promise((resolve, reject) => {
        const lector = new FileReader();

        lector.onload = () => resolve(lector.result);
        lector.onerror = reject;

        lector.readAsDataURL(dataUrlBase64);
      });
    }

    const comprimida = await comprimirImagen(dataUrl);

    const datos = extraerBase64DesdeDataUrl(comprimida);

    if (!datos) {
      console.error("No se pudo obtener el Base64");
      return "";
    }

    console.log("Base64:", datos.base64.length);

    const respuesta = await fetch(PUENTE_DRIVE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idMovimiento,
        mimeType: "image/jpeg",
        base64: datos.base64,
      }),
    });

    if (!respuesta.ok) {
      console.error("HTTP", respuesta.status);
      return "";
    }

    const resultado = await respuesta.json();

    console.log(resultado);

    if (resultado.status === "success") {
      return resultado.url;
    }

    console.error(resultado);

    return "";
  } catch (e) {
    console.error(e);
    return "";
  }
}

// ════════════════════════════════════════════════════════════════════════════
// Eliminar foto
// ════════════════════════════════════════════════════════════════════════════
export async function eliminarFotoRemito(url) {
  try {
    const respuesta = await fetch(PUENTE_DRIVE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "delete",
        url,
      }),
    });

    const resultado = await respuesta.json();

    return {
      ok: resultado.status === "success",
      message: resultado.message || "",
    };
  } catch (e) {
    return {
      ok: false,
      message: String(e),
    };
  }
}