import { useState } from "react";
import { generarId, ROLES } from "../constants.js";
import { inputStyle, btnPrincipal, btnSecundario, overlay, modal, labelStyle, fieldGroup } from "../styles.js";

// Componente para el modal de edición de usuario (incluye contraseña, nombre y rol)
function ModalEditarUsuario({ usuario, onGuardar, onClose }) {
  const [nombre, setNombre] = useState(usuario.nombre);
  const [rol, setRol] = useState(usuario.rol);
  const [password, setPassword] = useState(""); // Nueva contraseña
  const [confirmPassword, setConfirmPassword] = useState(""); // Confirmar nueva contraseña
  const [error, setError] = useState("");
  const roleOptions = ROLES.map(r => ({ value: r.value, label: r.label }));

  const handleGuardar = () => {
    if (!nombre.trim()) {
      setError("El nombre no puede estar vacío.");
      return;
    }

    let newPassword = usuario.password; // Por defecto, mantiene la contraseña actual
    if (password || confirmPassword) { // Si se intentó cambiar la contraseña
      if (!password.trim() || !confirmPassword.trim()) {
        setError("Debes completar ambos campos de contraseña si deseas cambiarla.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }
      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres.");
        return;
      }
      newPassword = password;
    }

    onGuardar({ ...usuario, nombre: nombre.trim(), rol, password: newPassword });
    onClose();
  };

  return (
    <div style={{...overlay, zIndex: 1001}}>
      <div style={{...modal, maxWidth: 420}}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", background: "linear-gradient(135deg,#1A3A5C,#2E7DC4)", borderRadius: "14px 14px 0 0" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>Editar Usuario</h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.8)" }}>Modificando: <strong>{usuario.nombre}</strong> (@{usuario.usuario})</p>
        </div>
        <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={fieldGroup}>
            <label style={labelStyle}>Nombre Completo</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldGroup}>
            <label style={labelStyle}>Rol</label>
            <select value={rol} onChange={(e) => setRol(e.target.value)} style={inputStyle}>
              {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div style={fieldGroup}>
            <label style={labelStyle}>Nueva Contraseña (dejar vacío para no cambiar)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
          </div>
          <div style={fieldGroup}>
            <label style={labelStyle}>Confirmar Nueva Contraseña</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
          </div>
          {error && <div style={{ color: "#DC2626", background: "#FEE2E2", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>⚠️ {error}</div>}
        </div>
        <div style={{ padding: "14px 22px", borderTop: "1px solid #E2E8F0", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{...btnSecundario, flex: 1}}>Cancelar</button>
          <button onClick={handleGuardar} style={{...btnPrincipal, flex: 1}}>Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
}

export default function PanelUsuarios({ usuarios, onUpdate, onClose, onAudit, usuarioActual }) {
  const [nuevo, setNuevo] = useState({ usuario: "", password: "", nombre: "", rol: "Operador" });
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [usuarioParaEditar, setUsuarioParaEditar] = useState(null); // Renombrado para edición general
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

  const handleGuardarUsuario = (usuarioEditado) => { // Ahora recibe el objeto completo
    onUpdate((prevUsuarios) => 
      prevUsuarios.map((u) => u.id === usuarioEditado.id ? usuarioEditado : u)
    );
    // El usuarioAfectado ya es usuarioEditado
    onAudit({
      tipo: "seguridad",
      detalle: `Editó al usuario '${usuarioEditado.nombre}' (Rol: ${usuarioEditado.rol})`,
    });
    setUsuarioParaEditar(null);
    mostrarMensaje(`Usuario "${usuarioEditado.nombre}" actualizado.`);
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
      {usuarioParaEditar && (
        <ModalEditarUsuario
          usuario={usuarioParaEditar}
          onClose={() => setUsuarioParaEditar(null)}
          onGuardar={handleGuardarUsuario}
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
                      <button onClick={() => setUsuarioParaEditar(u)} style={{ background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                        ✏️ Editar
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
