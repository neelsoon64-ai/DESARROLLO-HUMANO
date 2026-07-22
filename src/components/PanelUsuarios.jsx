import { useState } from "react";
import { generarId, ROLES } from "../constants.js";
import { inputStyle, btnPrincipal, btnSecundario, overlay, modal, labelStyle, fieldGroup } from "../styles.js";

// Componente para el modal de cambio de contraseña
function ModalCambiarPassword({ usuario, onGuardar, onClose }) {
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");

  const handleGuardar = () => {
    if (!pass || !confirmPass) {
      setError("Debes completar ambos campos.");
      return;
    }
    if (pass !== confirmPass) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (pass.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    onGuardar(usuario.id, pass);
    onClose();
  };

  return (
    <div style={{...overlay, zIndex: 1001}}>
      <div style={{...modal, maxWidth: 420}}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1E293B" }}>Cambiar Contraseña</h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B" }}>Estás modificando al usuario: <strong>{usuario.nombre}</strong></p>
        </div>
        <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={fieldGroup}>
            <label style={labelStyle}>Nueva Contraseña</label>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} style={inputStyle} placeholder="••••••••" />
          </div>
          <div style={fieldGroup}>
            <label style={labelStyle}>Confirmar Nueva Contraseña</label>
            <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} style={inputStyle} placeholder="••••••••" />
          </div>
          {error && <div style={{ color: "#DC2626", background: "#FEE2E2", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>⚠️ {error}</div>}
        </div>
        <div style={{ padding: "14px 22px", borderTop: "1px solid #E2E8F0", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{...btnSecundario, flex: 1}}>Cancelar</button>
          <button onClick={handleGuardar} style={{...btnPrincipal, flex: 1}}>Guardar Contraseña</button>
        </div>
      </div>
    </div>
  );
}

export default function PanelUsuarios({ usuarios, onUpdate, onClose, onAudit, usuarioActual }) {
  const [nuevo, setNuevo] = useState({ usuario: "", password: "", nombre: "", rol: "Operador" });
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [usuarioParaPassword, setUsuarioParaPassword] = useState(null);
  const roleLabels = Object.fromEntries(ROLES.map((role) => [role.value, role.label]));

  const mostrarMensaje = (texto) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(""), 3200);
  };

  const agregar = () => {
    if (!nuevo.usuario.trim() || !nuevo.password.trim() || !nuevo.nombre.trim()) return setError("Completá todos los campos.");
    if (usuarios.find((x) => x.usuario === nuevo.usuario.trim())) return setError("El usuario ya existe.");
    const u = { ...nuevo, id: generarId(), usuario: nuevo.usuario.trim(), password: nuevo.password.trim() };
    onUpdate((prev) => [...prev, u]);
    onAudit({ tipo: "seguridad", detalle: `Creó al usuario '${u.nombre}' (${u.rol})` });
    setNuevo({ usuario: "", password: "", nombre: "", rol: "Operador" });
    setError("");
    mostrarMensaje(`Usuario "${u.nombre}" creado correctamente.`);
  };

  const eliminar = (u) => {
    if (u.id === usuarioActual.id) return alert("No puedes eliminar a tu propio usuario.");
    if (!window.confirm(`¿Estás seguro de que quieres eliminar al usuario "${u.nombre}"?`)) return;
    onUpdate((prev) => prev.filter((x) => x.id !== u.id));
    onAudit({ tipo: "eliminacion", detalle: `Eliminó al usuario "${u.nombre}"` });
    mostrarMensaje(`Usuario "${u.nombre}" eliminado.`);
  };

  const handleGuardarPassword = (idUsuario, nuevaPassword) => {
    onUpdate((prevUsuarios) => 
      prevUsuarios.map((u) => u.id === idUsuario ? { ...u, password: nuevaPassword } : u)
    );
    const usuarioAfectado = usuarios.find(u => u.id === idUsuario);
    onAudit({
      tipo: "seguridad",
      detalle: `Cambió la contraseña del usuario '${usuarioAfectado.nombre}' (${usuarioAfectado.rol})`,
    });
    setUsuarioParaPassword(null);
    mostrarMensaje(`Contraseña de "${usuarioAfectado.nombre}" actualizada.`);
  };

  return (
    <div
      style={overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {usuarioParaPassword && (
        <ModalCambiarPassword
          usuario={usuarioParaPassword}
          onClose={() => setUsuarioParaPassword(null)}
          onGuardar={handleGuardarPassword}
        />
      )}

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
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
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
                <div style={{ width: 36, height: 36, borderRadius: 10, background: u.rol === "Administrador" ? "linear-gradient(135deg,#C8993A,#E8B84B)" : "linear-gradient(135deg,#2E7DC4,#4DA3D4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {u.nombre.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#1E293B" }}>{u.nombre}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>@{u.usuario} · {roleLabels[u.rol] || u.rol}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {u.id !== usuarioActual.id && (
                    <>
                      <button onClick={() => setUsuarioParaPassword(u)} style={{ background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                        Contraseña
                      </button>
                      <button onClick={() => eliminar(u)} style={{ background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "14px 22px", borderTop: "1px solid #E2E8F0" }}>
          <button onClick={onClose} style={{ ...btnSecundario, width: "100%" }}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
