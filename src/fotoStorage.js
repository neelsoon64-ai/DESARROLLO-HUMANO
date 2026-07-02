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

    // quitar prefijo base64
    const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;

    const payload = {
      idMovimiento,
      mimeType: "image/jpeg",
      base64
    };

    // 👇 IMPORTANTE: FormData para evitar CORS
    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));

    const respuesta = await fetch(
      "https://script.google.com/macros/s/AKfycbzl3eDGV--gvrB1NFJpdio0W2aHSBH9GhKjtntUMHn3bu3nVD2v6OrbspoKvNy9omTK/exec",
      {
        method: "POST",
        body: formData
      }
    );

    const resultado = await respuesta.json();

    if (resultado.status === "success") {
      return resultado.url;
    }

    console.error(resultado);
    return "";

  } catch (err) {
    console.error("Error subida:", err);
    return "";
  }
}