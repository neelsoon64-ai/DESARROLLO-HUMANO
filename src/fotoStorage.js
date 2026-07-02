const PUENTE_DRIVE_URL =
  import.meta.env.VITE_GOOGLE_DRIVE_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbzl3eDGV--gvrB1NFJpdio0W2aHSBH9GhKjtntUMHn3bu3nVD2v6OrbspoKvNy9omTK/exec";


// ─────────────────────────────────────────────
// PREVIEW DESDE ARCHIVO
// ─────────────────────────────────────────────
export function generarPreviewDesdeArchivo(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


// ─────────────────────────────────────────────
// COMPRESIÓN SIMPLE A JPEG
// ─────────────────────────────────────────────
async function comprimirImagen(dataUrl, maxWidth = 800, maxHeight = 600, quality = 0.7) {
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

      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed);
    };

    img.onerror = reject;
    img.src = dataUrl;
  });
}


// ─────────────────────────────────────────────
// EXTRAER BASE64
// ─────────────────────────────────────────────
function extraerBase64(dataUrl) {
  const match = /^data:(image\/[^;]+);base64,(.*)$/i.exec(dataUrl);
  if (!match) return null;

  return {
    mimeType: match[1],
    base64: match[2],
  };
}


// ─────────────────────────────────────────────
// SUBIR FOTO A GOOGLE DRIVE (SIN CORS)
// ─────────────────────────────────────────────
export async function subirFotoRemito(dataUrlBase64, idMovimiento = "remito") {
  try {
    if (!dataUrlBase64) return "";

    let dataUrl = "";

    if (typeof dataUrlBase64 === "string") {
      dataUrl = dataUrlBase64;
    } else {
      dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(dataUrlBase64);
      });
    }

    // comprimir
    const compressed = await comprimirImagen(dataUrl);

    const extraido = extraerBase64(compressed);

    if (!extraido) {
      console.error("No se pudo extraer base64");
      return "";
    }

    const payload = {
      idMovimiento,
      mimeType: "image/jpeg",
      base64: extraido.base64,
    };

    // 🔥 IMPORTANTE: FormData evita CORS preflight
    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));

    const response = await fetch(PUENTE_DRIVE_URL, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (result.status === "success") {
      return result.url;
    }

    console.error("Error upload:", result);
    return "";

  } catch (err) {
    console.error("Error subirFotoRemito:", err);
    return "";
  }
}


// ─────────────────────────────────────────────
// ELIMINAR FOTO
// ─────────────────────────────────────────────
export async function eliminarFotoRemito(url) {
  try {
    const response = await fetch(PUENTE_DRIVE_URL, {
      method: "POST",
      body: new FormData(
        Object.entries({
          data: JSON.stringify({
            action: "delete",
            url,
          }),
        })
      ),
    });

    const result = await response.json();

    return {
      ok: result.status === "success",
      message: result.message || "",
    };

  } catch (err) {
    return {
      ok: false,
      message: String(err),
    };
  }
}