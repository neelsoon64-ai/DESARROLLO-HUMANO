export function generarPreviewDesdeArchivo(file) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(lector.error);
    lector.readAsDataURL(file);
  });
}

export async function subirFotoRemito(file) {
  if (!file) return "";
  return generarPreviewDesdeArchivo(file);
}

export async function eliminarFotoRemito(url) {
  return;
}