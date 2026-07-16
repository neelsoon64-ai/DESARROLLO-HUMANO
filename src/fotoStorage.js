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

  // TU URL DE GOOGLE APPS SCRIPT INTEGRADA:
  const URL_PUENTE_DRIVE = "https://script.google.com/macros/s/AKfycbx80RqYtuzMz-FUcZw785wPDWfUseb_wuVQ3P73Wv9FLggcCb1aJiwyjwKtrw4o3KUQlg/exec";

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
      // Devolvemos la URL original que nos da el script. 
      // El componente ModalDetalle se encargará de formatearla para su visualización.
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