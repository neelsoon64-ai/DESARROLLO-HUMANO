import { useState, useCallback, useEffect } from "react";
import { USUARIOS_INICIALES, COLECCION, DOC_IDS } from "./constants.js";
import { useSharedState } from "./useSharedState.js";
import { firebaseConfigurado } from "./firebase.js";
import Login from "./components/Login.jsx";
import Seccion from "./components/Seccion.jsx";
import ModalRemito from "./components/ModalRemito.jsx";
import ModalDetalle from "./components/ModalDetalle.jsx";
import PanelAuditoria from "./components/PanelAuditoria.jsx";
import PanelUsuarios from "./components/PanelUsuarios.jsx";
import Dashboard from "./components/Dashboard.jsx"; 
import logo from "./assets/logo.png";
import { getDatabase, ref, remove, set } from "firebase/database";

export default function App() {
  // Mantienen sus escuchas activos en segundo plano
  const [usuarios, setUsuarios, usuariosListo] = useSharedState(COLECCION, DOC_IDS.usuarios, USUARIOS_INICIALES);
  const [nacion, setNacion] = useSharedState(COLECCION, DOC_IDS.nacion, {});
  const [provincia, setProvincia] = useSharedState(COLECCION, DOC_IDS.provincia, {});
  const [auditoriaRaw, setAuditoriaRaw] = useSharedState(COLECCION, DOC_IDS.auditoria, []);

  const [usuarioActual, setUsuarioActual] = useState(null);
  const [modalCarga, setModalCarga] = useState(null); 
  const [detalleMovimiento, setDetalleMovimiento] = useState(null);
  const [panelAudit, setPanelAudit] = useState(false);
  const [panelUsers, setPanelUsers] = useState(false);
  const [verDashboard, setVerDashboard] = useState(false); 
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [ultimaSync, setUltimaSync] = useState(new Date());
  const [, setTick] = useState(0);
  const [copiaRespaldo, setCopiaRespaldo] = useState(null);

  const auditoria = Array.isArray(auditoriaRaw) ? auditoriaRaw.filter(Boolean) : [];

  const setAuditoria = useCallback((actualizador) => {
    if (!setAuditoriaRaw) return;
    setAuditoriaRaw((prev) => {
      const previoValido = Array.isArray(prev) ? prev.filter(Boolean) : [];
      const siguiente = typeof actualizador === "function" ? actualizador(previoValido) : actualizador;
      return (Array.isArray(siguiente) ? siguiente : [])
        .filter(Boolean)
        .map(log => ({
          tipo: String(log?.tipo || "accion"),
          usuario: String(log?.usuario || "Sistema"),
          rol: String(log?.rol || "sistema"),
          detalle: String(log?.detalle || "Acción registrada"),
          fecha: String(log?.fecha || new Date().toISOString())
        }));
    });
  }, [setAuditoriaRaw]);

  const registrarAuditoria = useCallback((evento) => {
    const eventoSeguro = {
      tipo: String(evento?.tipo || "accion"),
      usuario: String(evento?.usuario || usuarioActual?.nombre || "Sistema"),
      rol: String(evento?.rol || usuarioActual?.rol || "sistema"),
      detalle: String(evento?.detalle || "Acción del sistema"),
      fecha: new Date().toISOString()
    };
    setAuditoria((prev) => [...prev, eventoSeguro]);
  }, [setAuditoria, usuarioActual]);

  useEffect(() => {
    setUltimaSync(new Date());
  }, [nacion, provincia, usuarios, auditoriaRaw]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    if (usuarioActual) {
      registrarAuditoria({ tipo: "logout", usuario: usuarioActual.nombre, rol: usuarioActual.rol, detalle: "Cerró sesión" });
    }
    setUsuarioActual(null);
    setMenuAbierto(false);
    setVerDashboard(false); 
  };

  const crearCopiaAhora = useCallback(() => {
    const usuariosSeguros = Array.isArray(usuarios) ? usuarios.filter(Boolean) : USUARIOS_INICIALES;
    const copia = {
      nacion: nacion || { movimientos: {} },
      provincia: provincia || { movimientos: {} },
      usuarios: usuariosSeguros,
      auditoria,
      fecha: new Date().toISOString(),
    };
    setCopiaRespaldo(copia);
    registrarAuditoria({
      tipo: "respaldo",
      usuario: usuarioActual?.nombre || "Sistema",
      rol: usuarioActual?.rol || "sistema",
      detalle: "Creó copia ahora",
    });
    return copia;
  }, [auditoria, nacion, provincia, registrarAuditoria, usuarioActual, usuarios]);

  const descargarRespaldo = useCallback((backup = null) => {
    const copia = backup || crearCopiaAhora();
    const json = JSON.stringify(copia, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `respaldo_inventario_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    registrarAuditoria({
      tipo: "exportar",
      usuario: usuarioActual?.nombre || "Sistema",
      rol: usuarioActual?.rol || "sistema",
      detalle: "Descargó respaldo",
    });
  }, [crearCopiaAhora, registrarAuditoria, usuarioActual]);

  const restaurarRespaldo = useCallback(async (backup) => {
    if (!backup || typeof backup !== "object") return;
    if (backup.nacion) setNacion(backup.nacion);
    if (backup.provincia) setProvincia(backup.provincia);
    if (backup.usuarios) setUsuarios(backup.usuarios);
    if (backup.auditoria) setAuditoria(() => backup.auditoria);
    registrarAuditoria({
      tipo: "restauracion",
      usuario: usuarioActual?.nombre || "Sistema",
      rol: usuarioActual?.rol || "sistema",
      detalle: "Restauró respaldo",
    });
  }, [registrarAuditoria, setAuditoria, setNacion, setProvincia, setUsuarios, usuarioActual]);

  const agregarCarga = useCallback(
    async (seccion, carga) => {
      const docId = seccion === "nacion" ? DOC_IDS.nacion : DOC_IDS.provincia;
      const setter = seccion === "nacion" ? setNacion : setProvincia;
      
      const idMovimiento = carga.id || "mov_" + Date.now() + Math.random().toString(36).substr(2, 5);

      const movimientoSeguro = {
        id: idMovimiento,
        descripcion: String(carga?.descripcion || "Sin descripción"),
        categoria: String(carga?.categoria || "General"),
        cantidad: Number(carga?.cantidad || 0),
        unidad: String(carga?.unidad || "unidades"),
        nroRemito: String(carga?.nroRemito || "s/n"),
        fecha: String(carga?.fecha || carga?.fechaCarga || new Date().toISOString()),
        fechaCarga: String(carga?.fechaCarga || carga?.fecha || new Date().toISOString()),
        proveedor: String(carga?.proveedor || "No informado"),
        observaciones: String(carga?.observaciones || ""),
        tipo: String(carga?.tipo || "ingreso"),
        foto: carga?.foto || "",
        cargadoPor: String(carga?.cargadoPor || "Desconocido"),
        editadoPor: String(carga?.editadoPor || "")
      };

      setter((prev) => {
        let movimientosPrevios = {};
        const movsBase = prev?.movimientos;
        if (movsBase) {
          if (Array.isArray(movsBase)) {
            movsBase.forEach((m, idx) => { if (m) movimientosPrevios[m.id || `key_${idx}`] = m; });
          } else if (typeof movsBase === "object") {
            movimientosPrevios = { ...movsBase };
          }
        }
        movimientosPrevios[idMovimiento] = movimientoSeguro;
        return { ...prev, movimientos: movimientosPrevios };
      });

      try {
        const db = getDatabase();
        const movimientoRef = ref(db, `${COLECCION}/${docId}/movimientos/${idMovimiento}`);
        await set(movimientoRef, movimientoSeguro);
      } catch (error) {
        console.error("Error al impactar en Firebase Realtime DB:", error);
      }
    },
    [setNacion, setProvincia]
  );

  const eliminarCarga = useCallback(
    async (seccion, carga) => {
      const docId = seccion === "nacion" ? DOC_IDS.nacion : DOC_IDS.provincia;
      const setter = seccion === "nacion" ? setNacion : setProvincia;
      const idMovimiento = carga?.id;
      if (!idMovimiento) return;

      setter((prev) => {
        const movsBase = prev?.movimientos;
        if (!movsBase) return prev;
        let movimientosPrevios = {};

        if (Array.isArray(movsBase)) {
          movsBase.filter(Boolean).forEach((mov) => {
            if (mov.id && mov.id !== idMovimiento) movimientosPrevios[mov.id] = mov;
          });
        } else if (typeof movsBase === "object") {
          movimientosPrevios = { ...movsBase };
          delete movimientosPrevios[idMovimiento];
        }

        return { ...prev, movimientos: movimientosPrevios };
      });

      try {
        const db = getDatabase();
        const movimientoRef = ref(db, `${COLECCION}/${docId}/movimientos/${idMovimiento}`);
        await remove(movimientoRef);
      } catch (error) {
        console.error("Error al eliminar en Firebase Realtime DB:", error);
      }
    },
    [setNacion, setProvincia]
  );

  const esAdmin = usuarioActual?.rol === "admin";

  const abrirDetalle = (mov, seccion) => {
    setDetalleMovimiento({ mov, seccion });
  };

  const cerrarDetalle = () => setDetalleMovimiento(null);

  const usuariosSeguros = usuariosListo && Array.isArray(usuarios) && usuarios.length > 0 
    ? usuarios 
    : USUARIOS_INICIALES;

  if (!usuarioActual) {
    return <Login usuarios={usuariosSeguros} onLogin={setUsuarioActual} onAudit={registrarAuditoria} />;
  }

  const sincLabel = (() => {
    const diff = Math.floor((new Date() - ultimaSync) / 1000);
    if (diff < 10) return "ahora";
    if (diff < 60) return `${diff}s`;
    return `${Math.floor(diff / 60)}m`;
  })();

  const nacionMovs = nacion && nacion.movimientos
    ? (Array.isArray(nacion.movimientos) ? nacion.movimientos : Object.values(nacion.movimientos)).filter(Boolean)
    : [];
    
  const provinciaMovs = provincia && provincia.movimientos
    ? (Array.isArray(provincia.movimientos) ? provincia.movimientos : Object.values(provincia.movimientos)).filter(Boolean)
    : [];
    
  const listaUsuarios = Array.isArray(usuarios) ? usuarios.filter(Boolean) : [];
  const articulosNacionUnicos = new Set(nacionMovs.filter(m => m?.descripcion).map((m) => `${m.categoria || ""}||${m.descripcion}`)).size;
  const articulosProvinciaUnicos = new Set(provinciaMovs.filter(m => m?.descripcion).map((m) => `${m.categoria || ""}||${m.descripcion}`)).size;

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Navbar */}
      <div style={{ background: "linear-gradient(135deg,#0F2540,#1A3A5C)", position: "sticky", top: 0, zIndex: 200, boxShadow: "0 2px 16px rgba(0,0,0,0.3)" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "13px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={logo} alt="Logo Gobierno de Chubut" style={{ width: 48, height: 48, objectFit: "contain" }} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, letterSpacing: 1.5, fontWeight: 700, textTransform: "uppercase" }}>
                Gobierno de la Provincia del Chubut
              </div>
              <div style={{ color: "#fff", fontSize: 16, fontWeight: 800, marginTop: 3 }}>
                Ministerio de Desarrollo Humano
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "5px 9px", color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: firebaseConfigurado ? "#22C55E" : "#F59E0B" }} />
              {firebaseConfigurado ? sincLabel : "local"}
            </div>

            <div style={{ position: "relative" }}>
              <button onClick={() => setMenuAbierto(!menuAbierto)} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "6px 10px", cursor: "pointer", color: "#fff" }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: esAdmin ? "linear-gradient(135deg,#C8993A,#E8B84B)" : "linear-gradient(135deg,#2E7DC4,#4DA3D4)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>
                  {usuarioActual?.nombre ? usuarioActual.nombre.charAt(0) : "U"}
                </div>
              </button>

              {menuAbierto && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", padding: "8px", minWidth: 210, zIndex: 300 }}>
                  <div style={{ padding: "8px 12px 12px", borderBottom: "1px solid #F1F5F9", marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{usuarioActual?.nombre}</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>{esAdmin ? "🔑 Administrador" : "👤 Usuario"}</div>
                  </div>
                  
                  {/* Botón de acceso al Dashboard */}
                  <button onClick={() => { setVerDashboard(!verDashboard); setMenuAbierto(false); }} style={{ width: "100%", textAlign: "left", padding: "9px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: "600", color: "#1B6EB5" }}>
                    {verDashboard ? "📋 Ver Inventario" : "📊 Ver Dashboard Analítico"}
                  </button>

                  {esAdmin && (
                    <>
                      <button onClick={() => { setPanelAudit(true); setMenuAbierto(false); }} style={{ width: "100%", textAlign: "left", padding: "9px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 13 }}>
                        🔍 Auditoría <span style={{ background: "#E2E8F0", borderRadius: 10, padding: "1px 7px" }}>{auditoria.length}</span>
                      </button>
                      <button onClick={() => { setPanelUsers(true); setMenuAbierto(false); }} style={{ width: "100%", textAlign: "left", padding: "9px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 13 }}>
                        👥 Gestionar Usuarios <span style={{ background: "#E2E8F0", borderRadius: 10, padding: "1px 7px" }}>{listaUsuarios.length}</span>
                      </button>
                    </>
                  )}
                  <button onClick={logout} style={{ width: "100%", textAlign: "left", padding: "9px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: "#DC2626" }}>
                    🚪 Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "18px 14px", display: "flex", flexDirection: "column", gap: 18 }}>
        
        {verDashboard ? (
          <Dashboard 
            nacionMovs={nacionMovs}
            provinciaMovs={provinciaMovs}
            listaUsuarios={listaUsuarios}
            auditoria={auditoria}
            onVolver={() => setVerDashboard(false)}
            onCrearCopiaAhora={crearCopiaAhora}
            onDescargarRespaldo={descargarRespaldo}
            onRestaurarRespaldo={restaurarRespaldo}
          />
        ) : (
          <>
            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {[
                { label: "Artículos Nación", value: articulosNacionUnicos, icon: "🏛️", color: "#1A3A5C" },
                { label: "Artículos Provincia", value: articulosProvinciaUnicos, icon: "🏢", color: "#2E7DC4" },
                { label: "Total Movimientos", value: nacionMovs.length + provinciaMovs.length, icon: "📋", color: "#C8993A" },
              ].map((stat) => (
                <div key={stat.label} style={{ background: "#fff", borderRadius: 12, padding: "13px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderTop: `3px solid ${stat.color}` }}>
                  <div style={{ fontSize: 18 }}>{stat.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 10, color: "#64748B", fontWeight: 600 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <Seccion 
              nombre="Inventario — Nación" 
              color="#1A3A5C" 
              colorClaro="#2E7DC4" 
              datos={{ movimientos: nacionMovs }} 
              onCarga={() => setModalCarga({ seccion: "nacion", datos: null })} 
              onEditar={(mov) => setModalCarga({ seccion: "nacion", datos: mov })} 
              onVerDetalle={(mov) => abrirDetalle(mov, "nacion")}
              usuarioActual={usuarioActual} 
              onAudit={registrarAuditoria} 
              auditoria={auditoria} 
            />
            
            <Seccion 
              nombre="Inventario — Provincia" 
              color="#1B6EB5" 
              colorClaro="#4DA3D4" 
              datos={{ movimientos: provinciaMovs }} 
              onCarga={() => setModalCarga({ seccion: "provincia", datos: null })} 
              onEditar={(mov) => setModalCarga({ seccion: "provincia", datos: mov })} 
              onVerDetalle={(mov) => abrirDetalle(mov, "provincia")}
              usuarioActual={usuarioActual} 
              onAudit={registrarAuditoria} 
              auditoria={auditoria} 
            />
          </>
        )}
      </div>

      {modalCarga && (
        <ModalRemito
          seccionNombre={modalCarga.seccion === "nacion" ? "Inventario — Nación" : "Inventario — Provincia"}
          datosEdicion={modalCarga.datos}
          onClose={() => setModalCarga(null)}
          onGuardar={(carga) => {
            const conUsuario = { 
              ...carga, 
              id: modalCarga.datos?.id || carga.id, 
              cargadoPor: modalCarga.datos?.cargadoPor || usuarioActual?.nombre || "Desconocido" 
            };
            agregarCarga(modalCarga.seccion, conUsuario);
            registrarAuditoria({
              tipo: modalCarga.datos ? "edicion" : "carga",
              usuario: usuarioActual?.nombre || "Desconocido",
              rol: usuarioActual?.rol || "usuario",
              detalle: `${modalCarga.datos ? "Editó" : "Cargó"} "${carga.descripcion}" (${carga.cantidad} ${carga.unidad}) en ${modalCarga.seccion === "nacion" ? "Nación" : "Provincia"} — Rem. ${carga.nroRemito || "s/n"}`,
            });
            setModalCarga(null);
          }}
          onEliminar={(carga) => {
            if (!modalCarga?.datos) return;
            eliminarCarga(modalCarga.seccion, carga);
            registrarAuditoria({
              tipo: "eliminacion",
              usuario: usuarioActual?.nombre || "Desconocido",
              rol: usuarioActual?.rol || "usuario",
              detalle: `Eliminó "${carga.descripcion}" (${carga.cantidad} ${carga.unidad}) de ${modalCarga.seccion === "nacion" ? "Nación" : "Provincia"} — Rem. ${carga.nroRemito || "s/n"}`,
            });
            setModalCarga(null);
          }}
        />
      )}

      {detalleMovimiento && (
        <ModalDetalle
          mov={detalleMovimiento.mov}
          esAdmin={esAdmin}
          onClose={cerrarDetalle}
          onEditar={() => {
            setModalCarga({ seccion: detalleMovimiento.seccion, datos: detalleMovimiento.mov });
            cerrarDetalle();
          }}
          onEliminar={(carga) => {
            eliminarCarga(detalleMovimiento.seccion, carga);
            registrarAuditoria({
              tipo: "eliminacion",
              usuario: usuarioActual?.nombre || "Desconocido",
              rol: usuarioActual?.rol || "usuario",
              detalle: `Eliminó "${carga.descripcion}" (${carga.cantidad} ${carga.unidad}) de ${detalleMovimiento.seccion === "nacion" ? "Nación" : "Provincia"} — Rem. ${carga.nroRemito || "s/n"}`,
            });
            cerrarDetalle();
          }}
        />
      )}

      {panelAudit && <PanelAuditoria logs={auditoria} onClose={() => setPanelAudit(false)} />}
      {panelUsers && <PanelUsuarios usuarios={listaUsuarios} setUsuarios={setUsuarios} onClose={() => setPanelUsers(false)} onAudit={registrarAuditoria} usuarioActual={usuarioActual} />}
    </div>
  );
}