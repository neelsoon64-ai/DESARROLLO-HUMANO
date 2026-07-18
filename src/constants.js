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

export const formatFecha = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const formatFechaCorta = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
};
