// ─── DATOS INICIALES ──────────────────────────────────────────────────────────
export const ROLES = [
  { value: "Administrador", label: "🔑 Administrador" },
  { value: "Supervisor", label: "🛠️ Supervisor" },
  { value: "Operador", label: "👷 Operador" },
  { value: "Auditor", label: "🔍 Auditor" },
  { value: "Consulta", label: "👁️ Consulta" },
];

export const USUARIOS_INICIALES = [
  { id: "u1", usuario: "admin", password: "admin123", nombre: "Administrador General", rol: "Administrador" },
  { id: "u2", usuario: "juaniparraguirre", password: "juan123", nombre: "Juan Parraguirre", rol: "Administrador" },
  { id: "u3", usuario: "operador1", password: "op123", nombre: "María González", rol: "Operador" },
  { id: "u4", usuario: "operador2", password: "op456", nombre: "Carlos Pérez", rol: "Operador" },
];

export const CATEGORIAS = [
  { id: "chapas", label: "Chapas", icon: "🏗️" },
  { id: "tirantes", label: "Tirantes", icon: "🪵" },
  { id: "modulos_alimentos", label: "Módulos de Alimentos", icon: "📦" },
  { id: "telas", label: "Telas", icon: "🧵" },
  { id: "ropa", label: "Ropa", icon: "👕" },
  { id: "calzado", label: "Calzado", icon: "👟" },
  { id: "colchones", label: "Colchones", icon: "🛏️" },
  { id: "frazadas", label: "Frazadas / Ropa de Cama", icon: "🛋️" },
  { id: "herramientas", label: "Herramientas", icon: "🔧" },
  { id: "materiales_construccion", label: "Materiales de Construcción", icon: "🧱" },
  { id: "medicamentos", label: "Medicamentos / Botiquines", icon: "💊" },
  { id: "otros", label: "Otros", icon: "📋" },
];

export const UNIDADES = ["unidades", "kg", "metros", "cajas", "bolsas", "packs", "litros"];

// ─── KEYS DE FIRESTORE ─────────────────────────────────────────────────────────
export const COLECCION = "inventario_mdh";
export const DOC_IDS = {
  nacion: "nacion",
  provincia: "provincia",
  auditoria: "auditoria",
  usuarios: "usuarios",
};

// ─── UTILIDADES ────────────────────────────────────────────────────────────────
export const generarId = () => Math.random().toString(36).slice(2, 10);

/**
 * Formatea una fecha 'YYYY-MM-DD' o ISO a 'DD/MM/YYYY' sin errores de zona horaria.
 * Trabaja directamente con el string para evitar que new Date() reste un día.
 * @param {string} fechaStr - La fecha en formato 'YYYY-MM-DD' o 'YYYY-MM-DDTHH:mm:ss.sssZ'.
 * @returns {string} La fecha formateada como 'D/M/YYYY' o una cadena vacía.
 */
export const formatFecha = (fechaStr) => {
  if (!fechaStr || typeof fechaStr !== 'string') return "—";

  // Tomamos solo la parte de la fecha, antes de la 'T' si existe.
  const soloFecha = fechaStr.split("T")[0];
  const partes = soloFecha.split("-");

  if (partes.length === 3) {
    const [year, month, day] = partes;
    // Usamos parseInt para quitar los ceros iniciales (ej: '05' -> '5')
    return `${parseInt(day, 10)}/${parseInt(month, 10)}/${year}`;
  }

  // Si el formato no es el esperado, devolvemos el string original.
  return fechaStr;
};

/**
 * Alias de formatFecha. Ambas funciones ahora hacen lo mismo y son seguras.
 * @param {string} fechaStr - La fecha en formato 'YYYY-MM-DD' o ISO.
 * @returns {string} La fecha formateada como 'D/M/YYYY'.
 */
export const formatFechaCorta = formatFecha;
