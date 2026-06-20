import { useState, useEffect } from "react";
import { generarId } from "../constants.js";
import { inputStyle, btnPrincipal, overlay, modal } from "../styles.js";

export default function PanelUsuarios({ usuarios, setUsuarios, onClose, onAudit, usuarioActual }) {
  const [nuevo, setNuevo] = useState({ usuario: "", password: "", nombre: "", rol: "usuario" });
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const mostrarMensaje = (texto) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(""), 3200);
  };

  const agregar = () => {
    if (!nuevo.usuario.trim() || !nuevo.password.trim() || !nuevo.nombre.trim()) return setError("Completá todos los campos.");
    if (usuarios.find((x) => x.usuario === nuevo.usuario.trim())) return setError("El usuario ya existe.");
    const u = { ...nuevo, id: generarId(), usuario: nuevo.usuario.trim() };
    setUsuarios((prev) => [...prev, u]);
    onAudit({ tipo: "edicion", usuario: usuarioActual.nombre, rol: usuarioActual.rol, detalle: `Creó usuario "${u.nombre}" (${u.rol})` });
    setNuevo({ usuario: "", password: "", nombre: "", rol: "usuario" });
    setError("");
    mostrarMensaje(`Usuario "${u.nombre}" creado correctamente.`);
  };

  const eliminar = (u) => {
    if (u.id === usuarioActual.id) return;
    setUsuarios((prev) => prev.filter((x) => x.id !== u.id));
    onAudit({ tipo: "eliminacion", usuario: usuarioActual.nombre, rol: usuarioActual.rol, detalle: `Eliminó usuario "${u.nombre}"` });
    mostrarMensaje(`Usuario "${u.nombre}" eliminado.`);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      style={overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div style={{ ...modal, maxWidth: 540 }}>
        <div style={{ background: "linear-gradient(135deg,#0F2540,#1A3A5C)", borderRadius: "14px 14px 0 0", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#C8993A", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>ADMINISTRACIÓN</div>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>👥 Gestión de Usuarios</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 8, width: 34, height: 34, cursor: "pointer", fontSize: 18 }}>×</button>
        </div>
        <div style={{ padding: 22, overflowY: "auto", maxHeight: "70vh", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1A3A5C", marginBottom: 12 }}>➕ Nuevo Usuario</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input placeholder="Nombre completo" value={nuevo.nombre} onChange={(e) => setNuevo((n) => ({ ...n, nombre: e.target.value }))} style={{ ...inputStyle, fontSize: 13 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input placeholder="Usuario" value={nuevo.usuario} onChange={(e) => setNuevo((n) => ({ ...n, usuario: e.target.value }))} style={{ ...inputStyle, fontSize: 13 }} />
                <input placeholder="Contraseña" type="password" value={nuevo.password} onChange={(e) => setNuevo((n) => ({ ...n, password: e.target.value }))} style={{ ...inputStyle, fontSize: 13 }} />
              </div>
              <select value={nuevo.rol} onChange={(e) => setNuevo((n) => ({ ...n, rol: e.target.value }))} style={{ ...inputStyle, fontSize: 13 }}>
                <option value="usuario">👤 Usuario Común</option>
                <option value="admin">🔑 Administrador</option>
              </select>
              {error && <div style={{ color: "#DC2626", fontSize: 12 }}>⚠️ {error}</div>}
              {mensaje && <div style={{ color: "#047857", fontSize: 12 }}>✅ {mensaje}</div>}
              <button onClick={agregar} style={{ ...btnPrincipal, fontSize: 13 }}>Agregar Usuario</button>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#475569", marginBottom: 8 }}>Usuarios activos ({usuarios.length})</div>
            {usuarios.map((u) => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#fff", borderRadius: 10, border: "1px solid #E2E8F0", marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: u.rol === "admin" ? "linear-gradient(135deg,#C8993A,#E8B84B)" : "linear-gradient(135deg,#2E7DC4,#4DA3D4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {u.nombre.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#1E293B" }}>{u.nombre}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>@{u.usuario} · {u.rol === "admin" ? "🔑 Admin" : "👤 Usuario"}</div>
                </div>
                {u.id !== usuarioActual.id && (
                  <button onClick={() => eliminar(u)} style={{ background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                    Eliminar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "14px 22px", borderTop: "1px solid #E2E8F0" }}>
          <button onClick={onClose} style={{ ...btnPrincipal, width: "100%" }}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
