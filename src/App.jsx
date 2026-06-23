import { useState, useCallback, useEffect } from "react";
import { USUARIOS_INICIALES, COLECCION, DOC_IDS } from "./constants.js";
import { useSharedState } from "./useSharedState.js";
import { firebaseConfigurado } from "./firebase.js";
import Login from "./components/Login.jsx";
import Seccion from "./components/Seccion.jsx";
import ModalRemito from "./components/ModalRemito.jsx";
import PanelAuditoria from "./components/PanelAuditoria.jsx";
import PanelUsuarios from "./components/PanelUsuarios.jsx";
import logo from "./assets/logo.png";

export default function App() {
  const [usuarios, setUsuarios, usuariosListo] = useSharedState(COLECCION, DOC_IDS.usuarios, USUARIOS_INICIALES);
  const [nacion, setNacion, nacionListo] = useSharedState(COLECCION, DOC_IDS.nacion, { movimientos: [] });
  const [provincia, setProvincia, provinciaListo] = useSharedState(COLECCION, DOC_IDS.provincia, { movimientos: [] });
  
  // 🔄 Conectado a Firebase para historial compartido entre dispositivos
  const [auditoriaRaw, setAuditoriaRaw, auditoriaListo] = useSharedState(COLECCION, DOC_IDS.auditoria, []);

  const [usuarioActual, setUsuarioActual] = useState(null);
  const [modalCarga, setModalCarga] = useState(null);
  const [panelAudit, setPanelAudit] = useState(false);
  const [panelUsers, setPanelUsers] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [ultimaSync, setUltimaSync] = useState(new Date());
  
  // Estado local para forzar el re-render del reloj de sincronización cada segundo
  const [, setTick] = useState(0);

  // 🛡️ Wrapper de seguridad: Sanitiza los datos de auditoría previniendo la inserción de valores corruptos
  const auditoria = Array.isArray(auditoriaRaw) 
    ? auditoriaRaw.filter(log => log !== null && log !== undefined) 
    : [];

  const setAuditoria = useCallback((actualizador) => {
    if (!setAuditoriaRaw) return;
    setAuditoriaRaw((prev) => {
      const previoValido = Array.isArray(prev) ? prev.filter(log => log !== null && log !== undefined) : [];
      const siguiente = typeof actualizador === "function" ? actualizador(previoValido) : actualizador;
      
      // Sanitiza estrictamente cada campo convirtiéndolo a String plano
      return (Array.isArray(siguiente) ? siguiente : [])
        .filter(log => log !== null && log !== undefined)
        .map(log => ({
          tipo: String(log?.tipo || "accion"),
          usuario: String(log?.usuario || "Sistema"),
          rol: String(log?.rol || "sistema"),
          detalle: String(log?.detalle || "Acción registrada"),
          fecha: String(log?.fecha || new Date().toISOString())
        }));
    });
  }, [setAuditoriaRaw]);

  const todoCargado = !!(usuariosListo && nacionListo && provinciaListo && auditoriaListo);

  // 🛡️ Guardado seguro que despacha el evento sanitizado
  const registrarAuditoria = useCallback(
    (evento) => {
      const eventoSeguro = {
        tipo: String(evento?.tipo || "accion"),
        usuario: String(evento?.usuario || usuarioActual?.nombre || "Sistema"),
        rol: String(evento?.rol || usuarioActual?.rol || "sistema"),
        detalle: String(evento?.detalle || "Acción del sistema"),
        fecha: new Date().toISOString()
      };

      setAuditoria((prev) => [...prev, eventoSeguro]);
    },
    [setAuditoria, usuarioActual]
  );

  // Monitorea cambios en los datos para actualizar la estampa de tiempo
  useEffect(() => {
    if (todoCargado) {
      setUltimaSync(new Date());
    }
  }, [nacion, provincia, usuarios, auditoriaRaw, todoCargado]);

  // Timer para que el contador de "Sincronizado hace x segundos" se actualice en vivo
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    if (usuarioActual) {
      registrarAuditoria({ tipo: "logout", usuario: usuarioActual.nombre, rol: usuarioActual.rol, detalle: "Cerró sesión" });
    }
    setUsuarioActual(null);
    setMenuAbierto(false);
  };

  const agregarCarga = useCallback(
    (seccion, carga) => {
      const setter = seccion === "nacion" ? setNacion : setProvincia;
      setter((prev) => {
        const actuales = prev && Array.isArray(prev.movimientos) ? prev.movimientos : [];
        return { ...prev, movimientos: [...actuales, carga] };
      });
    },
    [setNacion, setProvincia]
  );

  const esAdmin = usuarioActual?.rol === "admin";

  // ⚡ CONTROL DE CARGA INTELIGENTE: Si la lista de usuarios ya bajó, mostramos el Login al toque.
  if (!usuariosListo) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0F2540,#1A3A5C,#2E7DC4)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <img src={logo} alt="Logo" style={{ width: 64, height: 64, objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }} />
        <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>Iniciando componentes...</div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Conectando con el servidor de la Secretaría</div>
        <div style={{ width: 120, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 10, position: "relative", overflow: "hidden", marginTop: 4 }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: "40%", background: "#C8993A", borderRadius: 10 }} />
        </div>
      </div>
    );
  }

  // Si no hay sesión iniciada, va directo al Login sin bloquearse esperando los remitos pesados.
  if (!usuarioActual) {
    return <Login usuarios={Array.isArray(usuarios) ? usuarios : USUARIOS_INICIALES} onLogin={setUsuarioActual} onAudit={registrarAuditoria} />;
  }

  // Si ya se logueó pero las planillas siguen descargándose de Firebase en segundo plano:
  if (!todoCargado) {
    return (
      <div style={{ minHeight: "100vh", background: "#F1F5F9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <div style={{ color: "#1A3A5C", fontSize: 15, fontWeight: 700 }}>Sincronizando base de datos...</div>
        <div style={{ color: "#64748B", fontSize: 12 }}>Descargando planillas de Nación y Provincia</div>
        <div style={{ width: 160, height: 4, background: "#E2E8F0", borderRadius: 10, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: "75%", background: "#2E7DC4", borderRadius: 10 }} />
        </div>
      </div>
    );
  }

  const sincLabel = (() => {
    const diff = Math.floor((new Date() - ultimaSync) / 1000);
    if (diff < 10) return "ahora";
    if (diff < 60) return `${diff}s`;
    return `${Math.floor(diff / 60)}m`;
  })();

  const nacionMovs = nacion && Array.isArray(nacion.movimientos) ? nacion.movimientos : [];
  const provinciaMovs = provincia && Array.isArray(provincia.movimientos) ? provincia.movimientos : [];
  const auditoriaLogs = auditoria;
  const listaUsuarios = Array.isArray(usuarios) ? usuarios : [];

  const articulosNacionUnicos = new Set(nacionMovs.filter(m => m && m.descripcion).map((m) => `${m.categoria || ""}||${m.descripcion}`)).size;
  const articulosProvinciaUnicos = new Set(provinciaMovs.filter(m => m && m.descripcion).map((m) => `${m.categoria || ""}||${m.descripcion}`)).size;

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Navbar */}
      <div style={{ background: "linear-gradient(135deg,#0F2540,#1A3A5C)", position: "sticky", top: 0, zIndex: 200, boxShadow: "0 2px 16px rgba(0,0,0,0.3)" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "13px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={logo} alt="Logo" style={{ width: 40, height: 40, objectFit: "contain", flexShrink: 0 }} />
            <div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 8, letterSpacing: 2.5, fontWeight: 700 }}>SISTEMA DE GESTIÓN</div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>Secretaría de Trabajo</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div title={firebaseConfigurado ? "Sincronizado en tiempo real" : "Modo local sin sincronización"} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "5px 9px", color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: firebaseConfigurado ? "#22C55E" : "#F59E0B", display: "inline-block" }} />
              {firebaseConfigurado ? sincLabel : "local"}
            </div>

            <div style={{ position: "relative" }}>
              <button onClick={() => setMenuAbierto((m) => !m)} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "6px 10px", cursor: "pointer", color: "#fff" }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: esAdmin ? "linear-gradient(135deg,#C8993A,#E8B84B)" : "linear-gradient(135deg,#2E7DC4,#4DA3D4)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                  {usuarioActual?.nombre ? usuarioActual.nombre.charAt(0) : "U"}
                </div>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>▼</span>
              </button>

              {menuAbierto && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", padding: "8px", minWidth: 210, zIndex: 300 }}>
                  <div style={{ padding: "8px 12px 12px", borderBottom: "1px solid #F1F5F9", marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1E293B" }}>{usuarioActual?.nombre}</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>{esAdmin ? "🔑 Administrador" : "👤 Usuario"}</div>
                  </div>
                  {esAdmin && (
                    <>
                      <button onClick={() => { setPanelAudit(true); setMenuAbierto(false); }} style={{ width: "100%", textAlign: "left", padding: "9px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#1E293B", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                        🔍 Auditoría <span style={{ marginLeft: "auto", background: "#E2E8F0", borderRadius: 10, fontSize: 11, padding: "1px 7px", fontWeight: 700 }}>{auditoriaLogs.length}</span>
                      </button>
                      <button onClick={() => { setPanelUsers(true); setMenuAbierto(false); }} style={{ width: "100%", textAlign: "left", padding: "9px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#1E293B", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                        👥 Gestionar Usuarios <span style={{ marginLeft: "auto", background: "#E2E8F0", borderRadius: 10, fontSize: 11, padding: "1px 7px", fontWeight: 700 }}>{listaUsuarios.length}</span>
                      </button>
                      <div style={{ height: 1, background: "#E2E8F0", margin: "4px 0" }} />
                    </>
                  )}
                  <button onClick={logout} style={{ width: "100%", textAlign: "left", padding: "9px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#DC2626", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    🚪 Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ background: "#2E7DC4", height: 3 }} />
      </div>

      {menuAbierto && <div onClick={() => setMenuAbierto(false)} style={{ position: "fixed", inset: 0, zIndex: 150 }} />}

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "18px 14px", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Banner de sincronización */}
        <div style={{ background: "linear-gradient(135deg,#0F2540,#1A3A5C)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: firebaseConfigurado ? "#22C55E" : "#F59E0B", boxShadow: firebaseConfigurado ? "0 0 6px #22C55E" : "0 0 6px #F59E0B" }} />
            <div>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>
                {firebaseConfigurado ? "Sistema en tiempo real · Sincronizado" : "Modo local · Sin sincronizar"}
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>
                {firebaseConfigurado ? "Los cambios se ven al instante en todos los dispositivos" : "Configurá Firebase para usar en PC y celular a la vez"}
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {[
            { label: "Artículos Nación", value: articulosNacionUnicos, icon: "🏛️", color: "#1A3A5C" },
            { label: "Artículos Provincia", value: articulosProvinciaUnicos, icon: "🏢", color: "#2E7DC4" },
            { label: "Total Movimientos", value: nacionMovs.length + provinciaMovs.length, icon: "📋", color: "#C8993A" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "#fff", borderRadius: 12, padding: "13px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderTop: `3px solid ${stat.color}` }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{stat.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: "#64748B", fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {!esAdmin && (
          <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#1D4ED8" }}>
            ℹ️ Podés cargar y consultar movimientos. Solo el administrador puede editar o eliminar registros.
          </div>
        )}

        <Seccion nombre="Inventario — Nación" color="#1A3A5C" colorClaro="#2E7DC4" datos={{ movimientos: nacionMovs }} onCarga={() => setModalCarga("nacion")} onActualizar={setNacion} usuarioActual={usuarioActual} onAudit={registrarAuditoria} auditoria={auditoriaLogs} />
        <Seccion nombre="Inventario — Provincia" color="#1B6EB5" colorClaro="#4DA3D4" datos={{ movimientos: provinciaMovs }} onCarga={() => setModalCarga("provincia")} onActualizar={setProvincia} usuarioActual={usuarioActual} onAudit={registrarAuditoria} auditoria={auditoriaLogs} />

        <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 11, paddingBottom: 8 }}>
          Secretaría de Trabajo · Sistema de Control de Inventario
        </div>
      </div>

      {modalCarga && (
        <ModalRemito
          seccionNombre={modalCarga === "nacion" ? "Inventario — Nación" : "Inventario — Provincia"}
          onClose={() => setModalCarga(null)}
          onGuardar={(carga) => {
            const conUsuario = { ...carga, cargadoPor: usuarioActual?.nombre || "Desconocido" };
            agregarCarga(modalCarga, conUsuario);
            registrarAuditoria({
              tipo: "carga",
              usuario: usuarioActual?.nombre || "Desconocido",
              rol: usuarioActual?.rol || "usuario",
              detalle: `Cargó "${carga.descripcion}" (${carga.cantidad} ${carga.unidad}) en ${modalCarga === "nacion" ? "Nación" : "Provincia"} — Rem. ${carga.nroRemito || "s/n"}`,
            });
            setModalCarga(null);
          }}
        />
      )}

      {panelAudit && <PanelAuditoria logs={auditoriaLogs} onClose={() => setPanelAudit(false)} />}
      {panelUsers && <PanelUsuarios usuarios={listaUsuarios} setUsuarios={setUsuarios} onClose={() => { setPanelUsers(false); setMenuAbierto(false); }} onAudit={registrarAuditoria} usuarioActual={usuarioActual} />}
    </div>
  );
}