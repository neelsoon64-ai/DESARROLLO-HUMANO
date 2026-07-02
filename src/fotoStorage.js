const CLOUD_NAME = "lpuj6622";
const UPLOAD_PRESET = "remitos_upload";

export function generarPreviewDesdeArchivo(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function comprimirImagen(
  dataUrl,
  maxWidth = 1200,
  maxHeight = 1200,
  calidad = 0.8
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

      resolve(canvas.toDataURL("image/jpeg", calidad));
    };

    img.onerror = reject;
    img.src = dataUrl;
  });
}

export async function subirFotoRemito(dataUrlBase64, idMovimiento = "remito") {
  try {
    if (!dataUrlBase64) return "";

    let imagen = dataUrlBase64;

    if (!(typeof imagen === "string")) {
      imagen = await generarPreviewDesdeArchivo(imagen);
    }

    imagen = await comprimirImagen(imagen);

    const formData = new FormData();

    formData.append("file", imagen);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "remitos");
    formData.append("public_id", idMovimiento);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData
      }
    );

    const resultado = await response.json();

    console.log("Cloudinary:", resultado);

    if (resultado.secure_url) {
      return resultado.secure_url;
    }

    console.error(resultado);

    return "";

  } catch (err) {
    console.error(err);
    return "";
  }
}

export async function eliminarFotoRemito() {
  return {
    ok: true,
    message: "La eliminación desde Cloudinary requiere backend."
  };
}