import { useState, useCallback, useEffect, useMemo } from "react";
import { USUARIOS_INICIALES, COLECCION, DOC_IDS, ROLES, generarId, obtenerFechaLocal } from "./constants.js";
import { useSharedState } from "./useSharedState.js";
import { firebaseConfigurado } from "./firebase.js";
import Login from "./components/Login.jsx";
import Seccion from "./components/Seccion.jsx"; 
import ModalRemito from "./components/ModalRemito.jsx";
import ModalDetalle from "./components/ModalDetalle.jsx";
import PanelAuditoria from "./components/PanelAuditoria.jsx";
import PanelUsuarios from "./components/PanelUsuarios.jsx";
import Dashboard from "./components/Dashboard.jsx"; 
import PaginaExpedientes from "./components/PaginaExpedientes.jsx";
import PaginaStock from "./components/PaginaStock.jsx";
import { exportarRespaldoExcel, exportarRespaldoPDF } from "./exportUtils.js";
import {
  calcularStockDetallado,
  calcularStockDisponible,
  consolidarStock,
  crearArticuloId,
  crearClaveStockHistorico,
} from "./inventoryModel.js";
import logo from "./assets/logo.png";

export default function App() {
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
  const [vistaInventario, setVistaInventario] = useState("general");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [ultimaSync, setUltimaSync] = useState(new Date());
  const [, setTick] = useState(0);
  const [copiaRespaldo, setCopiaRespaldo] = useState(null);

  const auditoria = Array.isArray(auditoriaRaw) ? auditoriaRaw.filter(Boolean) : [];

  const stringify = (value) => {
    if (value == null) return "";
    return typeof value === "string" ? value : JSON.stringify(value);
  };

  const obtenerContexto = () => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    return {
      navegador: ua,
      dispositivo: /Mobi|Android|iPhone|iPad|Tablet/i.test(ua) ? "Móvil" : "PC",
    };
  };

  const setAuditoria = useCallback((actualizador) => {
    if (!setAuditoriaRaw) return;
    setAuditoriaRaw((prev) => {
      const previoValido = Array.isArray(prev) ? prev.filter(Boolean) : [];
      const siguiente = typeof actualizador === "function" ? actualizador(previoValido) : actualizador;
      return (Array.isArray(siguiente) ? siguiente : [])
        .filter(Boolean)
        .map((log) => ({
          tipo: String(log?.tipo || "accion"),
          usuario: String(log?.usuario || "Sistema"),
          rol: String(log?.rol || "sistema"),
          detalle: String(log?.detalle || "Acción registrada"),
          fecha: String(log?.fecha || new Date().toISOString()),
          antes: stringify(log?.antes),
          despues: stringify(log?.despues),
          ip: String(log?.ip || ""),
          navegador: String(log?.navegador || ""),
          dispositivo: String(log?.dispositivo || ""),
        }));
    });
  }, [setAuditoriaRaw]);

  const registrarAuditoria = useCallback((evento, ua = null) => {
    const contexto = obtenerContexto();
    const eventoSeguro = {
      tipo: String(evento?.tipo || "accion"),
      usuario: String(evento?.usuario || ua?.nombre || "Sistema"),
      rol: String(evento?.rol || ua?.rol || "sistema"),
      detalle: String(evento?.detalle || "Acción del sistema"),
      fecha: new Date().toISOString(),
      antes: stringify(evento?.antes),
      despues: stringify(evento?.despues),
      ip: String(evento?.ip || ""),
      navegador: String(evento?.navegador || contexto.navegador),
      dispositivo: String(evento?.dispositivo || contexto.dispositivo),
    };
    setAuditoria((prev) => [...prev, eventoSeguro]);
  }, [setAuditoria]);

  useEffect(() => {
    setUltimaSync(new Date());
  }, [nacion, provincia, usuarios, auditoriaRaw]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    if (usuarioActual) {
      registrarAuditoria({ tipo: "logout", usuario: usuarioActual.nombre, rol: usuarioActual.rol, detalle: "Cerró sesión" }, usuarioActual);
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
      detalle: "Creó copia ahora",
    }, usuarioActual);
    return copia;
  }, [auditoria, nacion, provincia, registrarAuditoria, usuarios, usuarioActual]);

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
      detalle: "Descargó respaldo JSON",
    }, usuarioActual);
  }, [crearCopiaAhora, registrarAuditoria, usuarioActual]);

  const descargarRespaldoExcel = useCallback(() => {
    const copia = crearCopiaAhora();
    exportarRespaldoExcel(copia, usuarioActual || { nombre: "Sistema", rol: "sistema" }, (evento) => registrarAuditoria(evento, usuarioActual));
  }, [crearCopiaAhora, registrarAuditoria, usuarioActual]);

  const descargarRespaldoPDF = useCallback(() => {
    const copia = crearCopiaAhora();
    exportarRespaldoPDF(copia, usuarioActual || { nombre: "Sistema", rol: "sistema" }, (evento) => registrarAuditoria(evento, usuarioActual));
  }, [crearCopiaAhora, registrarAuditoria, usuarioActual]);

  const restaurarRespaldo = useCallback(async (backup) => {
    if (!backup || typeof backup !== "object") return;
    if (backup.nacion) setNacion(backup.nacion);
    if (backup.provincia) setProvincia(backup.provincia);
    if (backup.usuarios) setUsuarios(backup.usuarios);
    if (backup.auditoria) setAuditoria(() => backup.auditoria);
    registrarAuditoria({
      tipo: "restauracion",
      detalle: "Restauró respaldo",
    }, usuarioActual);
  }, [registrarAuditoria, setAuditoria, setNacion, setProvincia, setUsuarios, usuarioActual]);

  const agregarCarga = useCallback(
    async (seccion, carga) => {
      // ✅ CORRECIÓN: Garantizar que el ID siempre existe y no se genera duplicado
      const idMovimiento = carga.id && String(carga.id).trim()
        ? String(carga.id).trim()
        : "mov_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);

      console.debug("agregarCarga: Usando ID:", idMovimiento, "ID carga:", carga.id);

      const movimientoSeguro = {
        id: idMovimiento,
        descripcion: String(carga?.descripcion || "Sin descripción").trim(),
        movimientoId: idMovimiento,
        categoria: carga?.categoria || "General",
        cantidad: Number(carga?.cantidad || 0),
        unidad: carga?.unidad || "unidades",
        nroRemito: carga?.nroRemito || null,
        orden_compra: carga?.orden_compra || null,
        numero_expediente: carga?.numero_expediente || null,
        expedienteId: carga?.expedienteId || null,
        compraId: carga?.compraId || null,
        articuloId: carga?.articuloId || null,
        legacyStockKey: carga?.legacyStockKey || null,
        fecha: carga?.fecha || carga?.fechaCarga || obtenerFechaLocal(),
        fechaCarga: carga?.fechaCarga || carga?.fecha || obtenerFechaLocal(),
        proveedor: carga?.proveedor || null,
        observaciones: carga?.observaciones || null,
        nombre_destinatario: carga?.nombre_destinatario || "",
        apellido_destinatario: carga?.apellido_destinatario || "",
        dni_destinatario: carga?.dni_destinatario || "",
        destinatario: carga?.destinatario || "",
        tipo: carga?.tipo || "ingreso",
        estado: carga?.estado || "Activo",
        motivo: carga?.motivo || null,
        fechaCompra: carga?.fechaCompra || null,
        fechaVencimiento: carga?.fechaVencimiento || null,
        estadoRemito: carga?.estadoRemito || "Pendiente",
        fechaCierre: carga?.fechaCierre || null,
        foto: carga?.foto || "",
        cargadoPor: carga?.cargadoPor || "Desconocido",
        editadoPor: carga?.editadoPor || null,
        origen: carga?.origen || null
      };

      const setter = seccion === "nacion" ? setNacion : setProvincia;

      await setter((prev) => {
        const base = prev || {};
        
        // ✅ FUERZA GARANTIZADA: Siempre convertir a array
        let movsArray = [];
        if (Array.isArray(base.movimientos)) {
          movsArray = [...base.movimientos].filter(Boolean);
        } else if (base.movimientos && typeof base.movimientos === 'object') {
          // Si es un objeto (por compatibilidad), convertirlo a array
          movsArray = Object.values(base.movimientos).filter(Boolean);
          console.debug("agregarCarga: Convertida estructura de objeto a array. Total movimientos:", movsArray.length);
        }
        
        // Buscar si el movimiento ya existe
        const idx = movsArray.findIndex(m => String(m?.id).trim() === String(idMovimiento).trim());

        if (movimientoSeguro.tipo === "egreso") {
          const articuloId = movimientoSeguro.articuloId ||
            crearArticuloId(movimientoSeguro.categoria, movimientoSeguro.descripcion, movimientoSeguro.unidad);
          const claveHistorica = movimientoSeguro.legacyStockKey ||
            crearClaveStockHistorico({ ...movimientoSeguro, origen: seccion });
          const stockActual = calcularStockDisponible(movsArray, {
            articuloId,
            compraId: movimientoSeguro.compraId,
            legacyStockKey: claveHistorica,
            origen: seccion,
            excluirId: idMovimiento,
          });
          if (Number(movimientoSeguro.cantidad) > stockActual) {
            throw new Error(`Stock insuficiente para esta compra. Disponible: ${stockActual}.`);
          }
        }
        
        if (idx !== -1) {
          console.debug("agregarCarga: Actualizando movimiento existente en índice:", idx);
          movsArray[idx] = movimientoSeguro;
        } else {
          console.debug("agregarCarga: Añadiendo nuevo movimiento. Total anterior:", movsArray.length);
          movsArray.push(movimientoSeguro);
          console.debug("agregarCarga: Total después de agregar:", movsArray.length);
        }
        
        return { ...base, movimientos: movsArray };
      });
    },
    [setNacion, setProvincia]
  );

  const crearExpediente = useCallback(async ({ seccion, expediente }) => {
    const setter = seccion === "nacion" ? setNacion : setProvincia;
    await setter((prev) => {
      const base = prev || {};
      const expedientes = Array.isArray(base.expedientes) ? base.expedientes : [];
      if (expedientes.some((actual) => actual.id === expediente.id || actual.numeroExpediente === expediente.numeroExpediente)) {
        return base;
      }
      return { ...base, expedientes: [...expedientes, expediente] };
    });
    registrarAuditoria({
      tipo: "carga",
      detalle: `Creó expediente ${expediente.numeroExpediente} en ${seccion === "nacion" ? "Nación" : "Provincia"}`,
    }, usuarioActual);
  }, [registrarAuditoria, setNacion, setProvincia, usuarioActual]);

  const crearCompra = useCallback(async ({ seccion, expediente, compra, lineas }) => {
    const setter = seccion === "nacion" ? setNacion : setProvincia;
    const fecha = compra.fechaCompra || obtenerFechaLocal();
    const compraSegura = {
      ...compra,
      expedienteId: expediente.id,
      numero_expediente: expediente.numeroExpediente,
      fechaCompra: fecha,
      creadaPor: usuarioActual?.nombre || "Desconocido",
      movimientosIds: lineas.map(() => `mov_${generarId()}`),
    };
    const movimientosNuevos = lineas.map((linea, indice) => ({
      id: compraSegura.movimientosIds[indice],
      movimientoId: compraSegura.movimientosIds[indice],
      tipo: "ingreso",
      descripcion: linea.descripcion,
      categoria: linea.categoria || "General",
      articuloId: crearArticuloId(linea.categoria, linea.descripcion, linea.unidad),
      cantidad: Number(linea.cantidad),
      unidad: linea.unidad || "unidades",
      compraId: compra.compraId,
      expedienteId: expediente.id,
      numero_expediente: expediente.numeroExpediente,
      nroRemito: compra.remitoNumero || null,
      orden_compra: compra.ordenCompra || null,
      proveedor: compra.proveedor || null,
      fecha,
      fechaCompra: fecha,
      fechaCarga: new Date().toISOString(),
      cargadoPor: usuarioActual?.nombre || "Desconocido",
      origen: seccion,
      estado: "Activo",
    }));

    await setter((prev) => {
      const base = prev || {};
      const compras = Array.isArray(base.compras) ? base.compras : [];
      if (compras.some((actual) => actual.compraId === compra.compraId)) return base;
      const existentes = Array.isArray(base.movimientos)
        ? base.movimientos.filter(Boolean)
        : Object.values(base.movimientos || {}).filter(Boolean);
      const idsExistentes = new Set(existentes.map((movimiento) => String(movimiento.id)));
      const movimientos = [...existentes, ...movimientosNuevos.filter((movimiento) => !idsExistentes.has(String(movimiento.id)))];
      return { ...base, compras: [...compras, compraSegura], movimientos };
    });
    registrarAuditoria({
      tipo: "carga",
      detalle: `Registró compra ${compra.ordenCompra || compra.compraId} para expediente ${expediente.numeroExpediente} con ${lineas.length} artículo(s)`,
    }, usuarioActual);
  }, [registrarAuditoria, setNacion, setProvincia, usuarioActual]);

  const asignarExpedienteHistorico = useCallback(async (movimiento, expediente) => {
    if (movimiento.origen !== expediente.seccion) {
      throw new Error("El expediente y el movimiento pertenecen a secciones diferentes.");
    }
    const setter = movimiento.origen === "nacion" ? setNacion : setProvincia;
    const datosActuales = movimiento.origen === "nacion" ? nacion : provincia;
    const movimientosActuales = Array.isArray(datosActuales?.movimientos)
      ? datosActuales.movimientos
      : Object.values(datosActuales?.movimientos || {}).filter(Boolean);
    if (!movimientosActuales.some((actual) => String(actual.id) === String(movimiento.id))) {
      throw new Error("El movimiento histórico ya no está disponible.");
    }
    await setter((prev) => {
      const base = prev || {};
      const movimientos = Array.isArray(base.movimientos)
        ? base.movimientos.filter(Boolean)
        : Object.values(base.movimientos || {}).filter(Boolean);
      const actualizados = movimientos.map((actual) => {
        if (String(actual.id) !== String(movimiento.id)) return actual;
        return {
          ...actual,
          ...(!actual.compraId && !actual.legacyStockKey
            ? { legacyStockKey: crearClaveStockHistorico({ ...actual, origen: movimiento.origen }) }
            : {}),
          expedienteId: expediente.id,
          numero_expediente: expediente.numeroExpediente,
        };
      });
      return { ...base, movimientos: actualizados };
    });
    registrarAuditoria({
      tipo: "edicion",
      detalle: `Asignó el expediente ${expediente.numeroExpediente} al movimiento "${movimiento.descripcion}"`,
      antes: "Sin expediente identificado",
      despues: expediente.numeroExpediente,
    }, usuarioActual);
  }, [nacion, provincia, registrarAuditoria, setNacion, setProvincia, usuarioActual]);

  const eliminarCarga = useCallback(
    async (seccion, carga) => {
      const idMovimiento = carga?.id;
      if (!idMovimiento) return;

      const setter = seccion === "nacion" ? setNacion : setProvincia;

      await setter((prev) => {
        const base = prev || {};
        
        // ✅ FUERZA GARANTIZADA: Siempre convertir a array
        let movsArray = [];
        if (Array.isArray(base.movimientos)) {
          movsArray = [...base.movimientos].filter(Boolean);
        } else if (base.movimientos && typeof base.movimientos === 'object') {
          movsArray = Object.values(base.movimientos).filter(Boolean);
        }
        
        // Filtrar eliminando el movimiento con el ID especificado
        const movsActualizados = movsArray.filter(m => String(m?.id).trim() !== String(idMovimiento).trim());
        
        console.debug("eliminarCarga: Antes:", movsArray.length, "Después:", movsActualizados.length);
        
        return { ...base, movimientos: movsActualizados };
      });
    },
    [setNacion, setProvincia]
  );

  const rolActual = usuarioActual?.rol || "";
  const roleLabels = Object.fromEntries(ROLES.map((role) => [role.value, role.label]));
  const rolLabel = roleLabels[rolActual] || "👤 Usuario";
  const esAdministrador = rolActual === "Administrador";
  const puedeEscribir = ["Administrador", "Supervisor", "Operador"].includes(rolActual);
  const puedeEliminar = ["Administrador", "Supervisor"].includes(rolActual);
  const puedeVerAuditoria = ["Administrador", "Supervisor", "Auditor"].includes(rolActual);
  const puedeGestionarUsuarios = rolActual === "Administrador";

  const abrirDetalle = (mov, seccion) => {
    setDetalleMovimiento({ mov, seccion });
  };

  const cerrarDetalle = () => setDetalleMovimiento(null);

  const usuariosSeguros = (() => {
    const listaGuardada = usuariosListo && Array.isArray(usuarios) && usuarios.length > 0 
      ? usuarios.filter(Boolean)
      : [];

    const existeAdmin = listaGuardada.some((u) => String(u.rol) === "Administrador");
    if (listaGuardada.length === 0 || !existeAdmin) {
      const adminsIniciales = USUARIOS_INICIALES.filter((u) => u.rol === "Administrador");
      const listaCombinada = [...listaGuardada];
      adminsIniciales.forEach((admin) => {
        if (!listaCombinada.some((u) => String(u.usuario).toLowerCase() === String(admin.usuario).toLowerCase())) {
          listaCombinada.push(admin);
        }
      });
      return listaCombinada;
    }

    return listaGuardada;
  })();

  // FIX: Todos los hooks se mueven a la parte superior del componente, antes de cualquier
  // retorno condicional, para cumplir con las Reglas de los Hooks.
  const normalizarMovimiento = (mov) => {
    if (!mov || typeof mov !== "object") return null;

    const tipoOriginal = String(mov.tipo || mov.tipoMovimiento || "").trim().toLowerCase();
    const tipoNormalizado =
      tipoOriginal === "entrada" || tipoOriginal === "ingreso" || tipoOriginal === "inicial"
        ? "ingreso"
        : tipoOriginal === "salida" || tipoOriginal === "egreso"
          ? "egreso"
          : tipoOriginal || "ingreso";

    const cantidad = Number(mov.cantidad ?? mov.total ?? 0);

    return {
      ...mov,
      tipo: tipoNormalizado,
      cantidad: Number.isFinite(cantidad) ? cantidad : 0,
      descripcion: String(mov.descripcion || mov.articulo || "Sin descripción").trim(),
      categoria: mov.categoria || "General",
      fechaCarga: mov.fechaCarga || mov.fecha || new Date().toISOString(),
      fecha: mov.fecha || mov.fechaCarga || new Date().toISOString(),
    };
  };

  const normalizarMovimientos = (valor) => {
    if (!valor) return [];
    const fuente = Array.isArray(valor) ? valor : Object.values(valor).filter(Boolean);
    return fuente.map(normalizarMovimiento).filter(Boolean);
  };

  const nacionMovs = normalizarMovimientos(nacion?.movimientos).map((mov) => ({ ...mov, origen: "nacion" }));
  const provinciaMovs = normalizarMovimientos(provincia?.movimientos).map((mov) => ({ ...mov, origen: "provincia" }));
  const todosLosMovimientos = [...nacionMovs, ...provinciaMovs];
  const stockNacion = useMemo(() => calcularStockDetallado(nacionMovs), [nacionMovs]);
  const stockProvincia = useMemo(() => calcularStockDetallado(provinciaMovs), [provinciaMovs]);
  const stockGlobalDetallado = useMemo(() => calcularStockDetallado(todosLosMovimientos), [nacionMovs, provinciaMovs]);
  const stockGlobal = useMemo(() => consolidarStock(stockGlobalDetallado), [stockGlobalDetallado]);
  const datosEdicionMemo = useMemo(() => {
    if (!modalCarga?.datos) return null;
    return { ...modalCarga.datos, esEdicionDesdeFicha: modalCarga.esEdicionDesdeFicha };
  }, [modalCarga?.datos, modalCarga?.esEdicionDesdeFicha]);

  if (!usuarioActual) {
    return <Login usuarios={usuariosSeguros} onLogin={setUsuarioActual} onAudit={(evento) => registrarAuditoria(evento)} />;
  }

  const sincLabel = (() => {
    const diff = Math.floor((new Date() - ultimaSync) / 1000);
    if (diff < 10) return "ahora";
    if (diff < 60) return `${diff}s`;
    return `${Math.floor(diff / 60)}m`;
  })();

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
                <div style={{ width: 26, height: 26, borderRadius: 7, background: esAdministrador ? "linear-gradient(135deg,#C8993A,#E8B84B)" : "linear-gradient(135deg,#2E7DC4,#4DA3D4)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>
                  {usuarioActual?.nombre ? usuarioActual.nombre.charAt(0) : "U"}
                </div>
              </button>

              {menuAbierto && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.2)", padding: "8px", minWidth: 210, zIndex: 300 }}>
                  <div style={{ padding: "8px 12px 12px", borderBottom: "1px solid #F1F5F9", marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{usuarioActual?.nombre}</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>{rolLabel}</div>
                  </div>
                  
                  <button onClick={() => { setVerDashboard(!verDashboard); setMenuAbierto(false); }} style={{ width: "100%", textAlign: "left", padding: "9px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: "600", color: "#1B6EB5" }}>
                    {verDashboard ? "📋 Ver Inventario" : "📊 Ver Dashboard Analítico"}
                  </button>

                  {puedeVerAuditoria && (
                    <button onClick={() => { setPanelAudit(true); setMenuAbierto(false); }} style={{ width: "100%", textAlign: "left", padding: "9px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 13 }}>
                      🔍 Auditoría <span style={{ background: "#E2E8F0", borderRadius: 10, padding: "1px 7px" }}>{auditoria.length}</span>
                    </button>
                  )}
                  {puedeGestionarUsuarios && (
                    <button onClick={() => { setPanelUsers(true); setMenuAbierto(false); }} style={{ width: "100%", textAlign: "left", padding: "9px 12px", border: "none", background: "none", cursor: "pointer", fontSize: 13 }}>
                      👥 Gestionar Usuarios <span style={{ background: "#E2E8F0", borderRadius: 10, padding: "1px 7px" }}>{listaUsuarios.length}</span>
                    </button>
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

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "18px 14px", display: "flex", flexDirection: "column", gap: 18 }}>
        
        {/* FIX: Restaurado el renderizado condicional estándar. Es seguro ahora que todos los hooks están en el nivel superior. */}
        {verDashboard && <Dashboard
            nacionMovs={nacionMovs}
            provinciaMovs={provinciaMovs}
            listaUsuarios={listaUsuarios}
            auditoria={auditoria}
            onVolver={() => setVerDashboard(false)}
            onCrearCopiaAhora={crearCopiaAhora}
            onDescargarRespaldo={descargarRespaldo}
            onDescargarRespaldoExcel={descargarRespaldoExcel}
            onDescargarRespaldoPDF={descargarRespaldoPDF}
            onRestaurarRespaldo={restaurarRespaldo}
          />}

        {!verDashboard && <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { id: "general", label: "Inventario general" },
              { id: "dependencias", label: "Inventario por dependencia" },
              { id: "expedientes", label: "Expedientes y Compras" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setVistaInventario(item.id)}
                style={{
                  border: "1px solid #CBD5E1",
                  borderRadius: 8,
                  padding: "9px 14px",
                  background: vistaInventario === item.id ? "#1A3A5C" : "#fff",
                  color: vistaInventario === item.id ? "#fff" : "#334155",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          {vistaInventario === "expedientes" ? (
            <PaginaExpedientes
              nacion={nacion}
              provincia={provincia}
              todosLosMovimientos={todosLosMovimientos}
              puedeEscribir={puedeEscribir}
              onCrearExpediente={crearExpediente}
              onCrearCompra={crearCompra}
              onAsignarExpediente={asignarExpedienteHistorico}
            />
          ) : vistaInventario === "general" ? (
            <PaginaStock stockConsolidado={stockGlobal} stockDetallado={stockGlobalDetallado} />
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

          {/* CONTENEDOR FLEXIBLE PARA LAYOUT LADO A LADO */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 450px', minWidth: 400 }}>
              <Seccion 
                nombre="Inventario — Nación" 
                color="#1A3A5C" 
                colorClaro="#2E7DC4" 
                datos={{ movimientos: nacionMovs }} 
                onCarga={puedeEscribir ? () => setModalCarga({ seccion: "nacion", datos: null }) : undefined} 
                onEditar={puedeEscribir ? (mov) => setModalCarga({ seccion: "nacion", datos: mov }) : undefined} 
                onRegistrarSalida={puedeEscribir ? (item) => setModalCarga({ 
                  seccion: "nacion", 
                  datos: { ...item, tipo: 'egreso', cantidad: '' },
                  esEdicionDesdeFicha: Boolean(item.stockKey)
                }) : undefined}
                onEliminar={puedeEliminar ? (mov) => eliminarCarga("nacion", mov) : undefined}
                puedeEliminar={puedeEliminar}
                onVerDetalle={(mov) => abrirDetalle(mov, "nacion")}
                usuarioActual={usuarioActual}
                onAudit={(evento) => registrarAuditoria(evento, usuarioActual)}
                auditoria={auditoria} 
              />
            </div>
            <div style={{ flex: '1 1 450px', minWidth: 400 }}>
              <Seccion 
                nombre="Inventario — Provincia" 
                color="#0D714C" 
                colorClaro="#10B981" 
                datos={{ movimientos: provinciaMovs }} 
                onCarga={puedeEscribir ? () => setModalCarga({ seccion: "provincia", datos: null }) : undefined} 
                onEditar={puedeEscribir ? (mov) => setModalCarga({ seccion: "provincia", datos: mov }) : undefined} 
                onRegistrarSalida={puedeEscribir ? (item) => setModalCarga({ 
                  seccion: "provincia", 
                  datos: { ...item, tipo: 'egreso', cantidad: '' },
                  esEdicionDesdeFicha: Boolean(item.stockKey)
                }) : undefined}
                onEliminar={puedeEliminar ? (mov) => eliminarCarga("provincia", mov) : undefined}
                puedeEliminar={puedeEliminar}
                onVerDetalle={(mov) => abrirDetalle(mov, "provincia")}
                usuarioActual={usuarioActual}
                onAudit={(evento) => registrarAuditoria(evento, usuarioActual)}
                auditoria={auditoria} 
              />
            </div>
          </div>
          </>
          )}
        </div>}
      </div>

      {modalCarga && (
        <ModalRemito
          seccionNombre={modalCarga.seccion === "nacion" ? "Inventario — Nación" : "Inventario — Provincia"}
          datosEdicion={datosEdicionMemo}
          expedientesExistentes={[
            ...todosLosMovimientos.map((movimiento) => movimiento.numero_expediente),
            ...(Array.isArray(nacion?.expedientes) ? nacion.expedientes.map((item) => item.numeroExpediente) : []),
            ...(Array.isArray(provincia?.expedientes) ? provincia.expedientes.map((item) => item.numeroExpediente) : []),
          ]}
          stockDisponible={modalCarga.seccion === "nacion" ? stockNacion : stockProvincia}
          onClose={() => setModalCarga(null)}
          onGuardar={async (carga) => {
            const conUsuario = { 
              ...carga,
              cargadoPor: modalCarga.datos?.cargadoPor || usuarioActual?.nombre || "Desconocido",
              editadoPor: modalCarga.datos ? (usuarioActual?.nombre || "Desconocido") : null,
              fechaEdicion: modalCarga.datos ? new Date().toISOString() : null
            };
            await agregarCarga(modalCarga.seccion, conUsuario);
            registrarAuditoria({
              tipo: modalCarga.datos ? "edicion" : "carga",
              detalle: `${modalCarga.datos ? "Editó" : "Cargó"} "${carga.descripcion}" (${carga.cantidad} ${carga.unidad}) en ${modalCarga.seccion === "nacion" ? "Nación" : "Provincia"} — Rem. ${carga.nroRemito || "s/n"}`,
            }, usuarioActual);
            setModalCarga(null);
          }}
        />
      )}

      {detalleMovimiento && (
        <ModalDetalle
          mov={detalleMovimiento.mov}
          seccion={detalleMovimiento.seccion}
          puedeEditar={puedeEscribir}
          puedeEliminar={puedeEliminar}
          onClose={cerrarDetalle}
          onEditar={() => {
            setModalCarga({ seccion: detalleMovimiento.seccion, datos: detalleMovimiento.mov });
            cerrarDetalle();
          }}
          onEliminar={(mov) => {
            eliminarCarga(detalleMovimiento.seccion, mov);
            registrarAuditoria({ tipo: "eliminacion", detalle: `Eliminó "${mov.descripcion}"` }, usuarioActual);
            cerrarDetalle();
          }}
        />
      )}

      {panelAudit && <PanelAuditoria logs={auditoria} onClose={() => setPanelAudit(false)} />}
      {panelUsers && <PanelUsuarios usuarios={listaUsuarios} onUpdate={setUsuarios} onClose={() => setPanelUsers(false)} onAudit={(evento) => registrarAuditoria(evento, usuarioActual)} usuarioActual={usuarioActual} />}
    </div>
  );
}