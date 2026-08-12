import { useState, useRef, useEffect } from "react";
import { CATEGORIAS, UNIDADES, generarId, obtenerFechaLocal } from "../constants.js";
import { inputStyle, labelStyle, fieldGroup, btnPrincipal, btnSecundario, overlay, modal } from "../styles.js";
import { generarPreviewDesdeArchivo, subirFotoRemito } from "../fotoStorage.js";

/**
 * Transforma cualquier formato de URL de Google Drive a una URL de thumbnail directa y segura para <img>.
 * Extrae el ID de formatos como /view, /open, /uc, etc. y construye la URL de thumbnail.
 * @param {string} urlOrId - La URL completa de Google Drive, el ID del archivo, o una URL de imagen estándar.
 * @returns {string} La URL del thumbnail o la URL original si ya es válida.
 */
const formatearUrlDrive = (idOrUrl) => {
  if (!idOrUrl || typeof idOrUrl !== "string") return "";

  // Si ya es una URL de thumbnail, una imagen en base64, o no es de Google Drive, la devolvemos.
  if (idOrUrl.startsWith("data:") || idOrUrl.startsWith("https://drive.google.com/thumbnail?")) {
    return idOrUrl;
  }

  const regex = /(?:https?:\/\/)?(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=))([a-zA-Z0-9_-]{28,})/;
  const match = idOrUrl.match(regex);
  const fileId = match ? match[1] : (idOrUrl.length > 25 && !idOrUrl.includes('/') ? idOrUrl : null);

  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1280`;
  }

  return ""; // Devolvemos cadena vacía para URLs inválidas.
};

/**
 * Convierte cualquier formato de fecha a un string 'YYYY-MM-DD' para el input HTML.
 * Es inmune a problemas de zona horaria al no usar `new Date()`.
 * @param {string | null} f - La fecha en formato ISO, 'DD/MM/YYYY' o 'YYYY-MM-DD'.
 * @returns {string} La fecha en formato 'YYYY-MM-DD' o una cadena vacía.
 */
const aFechaInput = (f) => {
  if (!f) return "";
  if (typeof f === 'string') {
    // Formato ISO (ej: 2026-08-12T03:00:00.000Z)
    if (f.includes('T')) return f.split('T')[0];
    // Formato DD/MM/YYYY (ej: 12/08/2026)
    if (f.includes('/')) {
      const partes = f.split('/');
      if (partes.length === 3) {
        const [dia, mes, anio] = partes;
        return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      }
    }
    // Formato YYYY-MM-DD (ej: 2026-08-12) o similar que ya es compatible
    if (f.includes('-')) return f.substring(0, 10);
  }
  return "";
};

export default function ModalRemito({ onClose, onGuardar, seccionNombre, datosEdicion, expedientesExistentes = [], stockDisponible = [] }) {
  const inicial = datosEdicion || {};
  const esEdicion = !!datosEdicion;
  const esEdicionDesdeFicha = !!datosEdicion?.esEdicionDesdeFicha;
  
  const fotosIniciales = Array.isArray(inicial.foto) 
    ? inicial.foto 
    : (inicial.foto ? [inicial.foto] : []);

  const expedientesUnicos = [...new Set(expedientesExistentes)].filter(Boolean);

  // ✅ La estructura del formulario se mantiene, asegurando que cada campo tiene su lugar.
  const [form, setForm] = useState({
    fecha: aFechaInput(inicial.fecha) || obtenerFechaLocal(),
    nroRemito: inicial.nroRemito || "",
    orden_compra: inicial.orden_compra || "",
    proveedor: inicial.proveedor || "",
    observaciones: inicial.observaciones || "",
    nombre_destinatario: inicial.nombre_destinatario || "",
    apellido_destinatario: inicial.apellido_destinatario || "",
    dni_destinatario: inicial.dni_destinatario || "",
    direccion: inicial.direccion || "",
    localidad: inicial.localidad || "",
    destinatario: inicial.destinatario || "",
    tipo: inicial.tipo || "ingreso", 
    categoria: inicial.categoria || CATEGORIAS[0].id,
    descripcion: inicial.descripcion || "",
    cantidad: inicial.cantidad || "",
    unidad: inicial.unidad || "unidades",
    estado: inicial.estado || "Activo",
    motivo: inicial.motivo || "",
    numero_expediente: inicial.numero_expediente || "",
    fechaCompra: aFechaInput(inicial.fechaCompra),
    fechaVencimiento: aFechaInput(inicial.fechaVencimiento),
    estadoRemito: inicial.estadoRemito || "Pendiente",
    fechaCierre: aFechaInput(inicial.fechaCierre),
    listaFotos: fotosIniciales.map((foto, idx) => ({
      id: `foto-inicial-${idx}`,
      url: foto, // Se mantiene el ID o URL original para el guardado
      preview: formatearUrlDrive(foto) // Se usa una URL formateada y segura para la vista previa
    })),
  });

  const [cargandoFoto, setCargandoFoto] = useState(false);
  const [arrastrandoFoto, setArrastrandoFoto] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const fileInputGaleriaRef = useRef(null);
  const fileInputCamaraRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ✅ CORRECCIÓN CRÍTICA: Sincronizar el estado del formulario cuando `datosEdicion` cambie.
  // Esto asegura que si el modal se reutiliza o `datosEdicion` se actualiza, el formulario
  // refleje los datos más recientes, aplicando el formato correcto a las fechas.
  useEffect(() => {
    if (datosEdicion) {
      const fotosActuales = Array.isArray(datosEdicion.foto) 
        ? datosEdicion.foto 
        : (datosEdicion.foto ? [datosEdicion.foto] : []);

      setForm({
        fecha: aFechaInput(datosEdicion.fecha) || obtenerFechaLocal(),
        nroRemito: datosEdicion.nroRemito || "",
        orden_compra: datosEdicion.orden_compra || "",
        proveedor: datosEdicion.proveedor || "",
        observaciones: datosEdicion.observaciones || "",
        nombre_destinatario: datosEdicion.nombre_destinatario || "",
        apellido_destinatario: datosEdicion.apellido_destinatario || "",
        dni_destinatario: datosEdicion.dni_destinatario || "",
        direccion: datosEdicion.direccion || "",
        localidad: datosEdicion.localidad || "",
        destinatario: datosEdicion.destinatario || "",
        tipo: datosEdicion.tipo || "ingreso", 
        categoria: datosEdicion.categoria || CATEGORIAS[0].id,
        descripcion: datosEdicion.descripcion || "",
        cantidad: datosEdicion.cantidad || "",
        unidad: datosEdicion.unidad || "unidades",
        estado: datosEdicion.estado || "Activo",
        motivo: datosEdicion.motivo || "",
        numero_expediente: datosEdicion.numero_expediente || "",
        fechaCompra: aFechaInput(datosEdicion.fechaCompra),
        fechaVencimiento: aFechaInput(datosEdicion.fechaVencimiento),
        estadoRemito: datosEdicion.estadoRemito || "Pendiente",
        fechaCierre: aFechaInput(datosEdicion.fechaCierre),
        listaFotos: fotosActuales.map((foto, idx) => ({
          id: `foto-inicial-${idx}`,
          url: foto,
          preview: formatearUrlDrive(foto)
        })),
      });
    }
  }, [datosEdicion]);

  const procesarArchivos = async (files) => {
    if (!files || files.length === 0) return;
    
    setCargandoFoto(true);
    setError("");
    
    const nuevasFotos = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.debug("ModalRemito: procesando archivo:", { name: file.name, type: file.type, size: file.size });
      if (!file.type.startsWith("image/")) {
        setError("Uno de los archivos no es una imagen válida.");
        continue;
      }

      try {
        const preview = await generarPreviewDesdeArchivo(file);
        nuevasFotos.push({
          id: `foto-${i}-${Math.random().toString(36).substring(2, 7)}-${Date.now()}`,
          preview,
          file
        });
      } catch (err) {
        setError("Hubo un problemita al procesar algunas imágenes.");
        console.error("ModalRemito: error al generar vista previa de imagen:", err);
      }
    }

    if (nuevasFotos.length > 0) {
      setForm((f) => {
        const siguiente = { ...f, listaFotos: [...f.listaFotos, ...nuevasFotos] };
        console.debug("ModalRemito: fotos añadidas, total ahora:", siguiente.listaFotos.length);
        return siguiente;
      });
    }

    let errorMsg = "";
    if (errorMsg) setError(errorMsg);
    setCargandoFoto(false);
  };

  const handleInputChange = (e) => {
    if (e.target.files) procesarArchivos(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setArrastrandoFoto(false);
    if (e.dataTransfer.files) procesarArchivos(e.dataTransfer.files);
  };

  const quitarFoto = (idABorrar) => {
    setForm((f) => ({
      ...f,
      listaFotos: f.listaFotos.filter((foto) => foto.id !== idABorrar)
    }));
  };

  const handleGuardar = async () => {
    if (!form.descripcion.trim()) return setError("Ingresá una descripción.");
    if (!form.cantidad || isNaN(Number(form.cantidad)) || Number(form.cantidad) <= 0)
      return setError("Ingresá una cantidad válida.");
    
    // ✅ VALIDACIÓN DE STOCK PARA EGRESOS
    if (form.tipo === 'egreso') {
      const itemEnStock = stockDisponible.find(item => item.descripcion === form.descripcion && item.categoria === form.categoria);
      const stockActual = itemEnStock ? itemEnStock.stock : 0;
      if (Number(form.cantidad) > stockActual) {
        return setError(`Stock insuficiente. Disponible: ${stockActual} unidades.`);
      }
    }
    if (form.estado === "Dado de baja" && !form.motivo) return setError("Seleccioná un motivo para Dado de baja.");
    if (form.estadoRemito === "Cerrado" && !form.fechaCierre) return setError("Ingresá la fecha de cierre del remito.");
    setError("");

    // ✅ GARANTIZAR QUE EL ID SE PRESERVE AL EDITAR, PERO SE GENERE UNO NUEVO
    // para cada carga/salida nueva. Si se abre desde una ficha/stock, no debe
    // reutilizar el ID del ítem base porque eso sobrescribe el movimiento anterior.
    const esNuevaCarga = !esEdicion || esEdicionDesdeFicha;
    const id = esNuevaCarga ? generarId() : (inicial.id || generarId());
    setSubiendo(true);

    try {
      // ─── 📝 PROCESAMIENTO Y SUBIDA EN PARALELO A TU GOOGLE DRIVE ───
      const fotosProcesadas = await Promise.all(
        form.listaFotos.map(async (f, idx) => {
          // ✅ CORRECCIÓN DEFINITIVA: Si la foto tiene una URL que empieza con http,
          // es una foto ya subida a Google Drive. La devolvemos directamente.
          if (f.url && f.url.startsWith("http")) return f.url;
          
          // Si la foto tiene una vista previa en base64, es un archivo nuevo para subir.
          if (f.preview && f.preview.startsWith("data:image")) {
            try {
              console.log(`Subiendo adjunto index ${idx} a Google Drive...`);
              return await subirFotoRemito(f.preview, `remito_${id}_${idx}`);
            } catch (driveErr) {
              console.error("Falló la subida a Drive para esta imagen:", driveErr);
              return null; // Devolvemos null en caso de error para filtrarlo después.
            }
          }
          return null; // Si no es ni URL ni base64, es inválido.
        })
      );

      // ✅ REFACTORIZACIÓN FOTOS: Lógica mejorada para conservar fotos existentes.
      const fotosFinalesFiltradas = fotosProcesadas.filter(url => url !== null && url !== "");

      // Si se subieron fotos nuevas, se usan.
      // Si no se subieron fotos nuevas y estamos editando, se conservan las originales.
      // Si es una carga nueva y no hay fotos, se guarda un array vacío o string.
      const fotoFinal = fotosFinalesFiltradas.length > 0
        ? (fotosFinalesFiltradas.length === 1 ? fotosFinalesFiltradas[0] : fotosFinalesFiltradas)
        : (esEdicion ? (inicial.foto || []) : []); // Usamos array vacío por consistencia.

      console.debug("ModalRemito: Guardando payload final con enlaces limpios.", { fotoFinal });


      const proveedorFinal = form.tipo === "inicial" && !form.proveedor.trim() 
        ? "Inventario Físico Inicial" 
        : form.proveedor.trim();

      // Determinar dinámicamente si es nacion o provincia basado en el título del modal
      const origenDetectado = seccionNombre?.toLowerCase().includes("nación") || seccionNombre?.toLowerCase().includes("nacion")
        ? "nacion"
        : "provincia";

      // ✅ ESTRUCTURA DE DATOS GARANTIZADA: Cada campo se mapea a su lugar correcto.
      // ─── 🚀 ENVÍO INMUNE A TU BASE DE DATOS ───
      onGuardar({
        ...inicial, // Preserva todos los campos originales no modificados
        id,
        fecha: form.fecha, // Se guarda el string 'YYYY-MM-DD' directamente
        fechaCarga: inicial.fechaCarga || new Date().toISOString(), // Se mantiene la fecha de carga original o se crea una nueva
        origen: origenDetectado, // 🔥 ESTA LÍNEA SOLUCIONA EL FILTRADO Y GUARDADO
        nroRemito: form.nroRemito,
        orden_compra: form.orden_compra.trim().toUpperCase(),
        proveedor: proveedorFinal,
        
        // ✅ CORRECCIÓN CRÍTICA: Lógica de guardado parcial y sin duplicados.
        // Solo se actualizan los campos del destinatario si el tipo es 'egreso'.
        // Si es 'ingreso', los campos existentes en `...inicial` se preservan.
        ...(form.tipo === 'egreso' && {
          destinatario: form.destinatario.trim(),
          nombre_destinatario: form.nombre_destinatario.trim(),
          apellido_destinatario: form.apellido_destinatario.trim(),
          dni_destinatario: form.dni_destinatario.trim(),
          direccion: form.direccion.trim(),
          localidad: form.localidad.trim(),
        }),

        observaciones: form.observaciones,
        tipo: form.tipo,
        categoria: form.categoria,
        descripcion: form.descripcion.trim(),
        cantidad: Number(form.cantidad),
        unidad: form.unidad,
        estado: form.estado || "Activo",
        motivo: form.estado === "Dado de baja" ? (form.motivo || "") : "",
        fechaCompra: form.fechaCompra || null,
        fechaVencimiento: form.fechaVencimiento || null,
        numero_expediente: form.numero_expediente.trim().toUpperCase(), // ✅ GUARDAR EXPEDIENTE EN MAYÚSCULAS
        estadoRemito: form.estadoRemito || "Pendiente",
        fechaCierre: form.estadoRemito === "Cerrado" ? (form.fechaCierre || obtenerFechaLocal()) : null,
        foto: fotoFinal 
      });

      setSubiendo(false);
      onClose();
    } catch (err) {
      setSubiendo(false);
      console.error("Error crítico en handleGuardar:", err);
      setError("No se pudo estructurar el guardado del movimiento. Intentá nuevamente.");
    }
  };

  const catActual = CATEGORIAS.find((c) => c.id === form.categoria);
  const procesando = cargandoFoto || subiendo;

  const headerBg = esEdicion 
    ? "linear-gradient(135deg,#C8993A,#E8B84B)" 
    : form.tipo === "ingreso" 
      ? "linear-gradient(135deg,#0D714C,#10B981)" 
      : form.tipo === "egreso"
        ? "linear-gradient(135deg,#B91C1C,#F97316)"
        : "linear-gradient(135deg,#1E40AF,#2563EB)";

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ background: headerBg, borderRadius: "14px 14px 0 0", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "background 0.3s ease" }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{seccionNombre}</div>
            <div style={{ color: "#fff", fontSize: 17, fontWeight: 700, marginTop: 2 }}>
              {esEdicion ? "✏️ Editar Movimiento" : form.tipo === "inicial" ? "💾 Carga de Stock Inicial" : "Nueva Carga de Remito"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 8, width: 34, height: 34, cursor: "pointer", fontSize: 18 }}>×</button>
        </div>

        <div style={{ padding: "22px", overflowY: "auto", maxHeight: "68vh", display: "flex", flexDirection: "column", gap: 14 }}>
          
          <div style={fieldGroup}>
            <label style={labelStyle}>Tipo de movimiento</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { v: "ingreso", l: "📥 Ingreso", color: "#059669", bg: "#D1FAE5" },
                { v: "egreso", l: "📤 Egreso", color: "#DC2626", bg: "#FEE2E2" },
                { v: "inicial", l: "💾 Stock Inicial", color: "#2563EB", bg: "#DBEAFE" }
              ].map(({ v, l, color, bg }) => (
                <button
                  key={v}
                  type="button" // Deshabilitado si es edición real o si viene de la ficha
                  disabled={esEdicion}
                  onClick={() => set("tipo", v)}
                  style={{
                    flex: 1,
                    minWidth: "100px",
                    padding: "10px",
                    border: `2px solid ${form.tipo === v ? color : "#E2E8F0"}`,
                    borderRadius: 8,
                    background: form.tipo === v ? bg : "#F8FAFC",
                    color: form.tipo === v ? color : "#64748B",
                    fontWeight: 700, 
                    cursor: esEdicion || esEdicionDesdeFicha ? "not-allowed" : "pointer", 
                    fontSize: 12,
                    transition: "all 0.2s",
                    opacity: (esEdicion || esEdicionDesdeFicha) && form.tipo !== v ? 0.4 : 1
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={fieldGroup}>
              <label style={labelStyle}>Fecha</label>
              <input type="date" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>N° Remito / Comprobante</label>
              <input type="text" placeholder={form.tipo === "inicial" ? "Opcional (Ej: Ajuste-01)" : "REM-0001"} value={form.nroRemito} onChange={(e) => set("nroRemito", e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* ✅ CAMPO NUEVO: N° de Expediente con autocompletado */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={fieldGroup}>
              <label style={labelStyle}>N° de Expediente (Opcional)</label>
              <input type="text" list="expedientes-lista" placeholder="Ej: EXP-2024-12345" value={form.numero_expediente} onChange={(e) => set("numero_expediente", e.target.value)} style={inputStyle} />
              <datalist id="expedientes-lista">
                {expedientesUnicos.map(exp => <option key={exp} value={exp} />)}
              </datalist>
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>Orden de Compra (Opcional)</label>
              <input type="text" placeholder="Ej: OC-2024-0001" value={form.orden_compra} onChange={(e) => set("orden_compra", e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* ✅ LÓGICA DE CAMPO CORREGIDA: Muestra el campo correcto según el tipo de movimiento */}
          {form.tipo === 'ingreso' || form.tipo === 'inicial' ? (
            <div style={fieldGroup}>
              <label style={labelStyle}>
                {form.tipo === "inicial" ? "Ubicación / Depósito" : "Proveedor / Origen"}
              </label>
              <input 
                type="text" 
                placeholder={form.tipo === "inicial" ? "Ej: Depósito Central (Opcional)" : "Nombre o procedencia"} 
                value={form.proveedor} 
                onChange={(e) => set("proveedor", e.target.value)} 
                style={inputStyle} 
              />
            </div>
          ) : ( // Si es egreso
            <><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={fieldGroup}>
                  <label style={labelStyle}>Nombre Destinatario</label>
                  <input type="text" placeholder="Ej: Juan" value={form.nombre_destinatario} onChange={(e) => set("nombre_destinatario", e.target.value)} style={inputStyle} />
                </div>
                <div style={fieldGroup}>
                  <label style={labelStyle}>Apellido Destinatario</label>
                  <input type="text" placeholder="Ej: Pérez" value={form.apellido_destinatario} onChange={(e) => set("apellido_destinatario", e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={fieldGroup}>
                  <label style={labelStyle}>DNI Destinatario</label>
                  <input type="text" placeholder="Ej: 20123456" value={form.dni_destinatario} onChange={(e) => set("dni_destinatario", e.target.value)} style={inputStyle} />
                </div><div style={fieldGroup}>
                  <label style={labelStyle}>Institución (Opcional)</label>
                  <input type="text" placeholder="Nombre de la institución" value={form.destinatario} onChange={(e) => set("destinatario", e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={fieldGroup}>
                  <label style={labelStyle}>Dirección (Opcional)</label>
                  <input type="text" placeholder="Ej: Av. Fontana 50" value={form.direccion} onChange={(e) => set("direccion", e.target.value)} style={inputStyle} />
                </div>
                <div style={fieldGroup}>
                  <label style={labelStyle}>Localidad (Opcional)</label>
                  <input type="text" placeholder="Ej: Rawson" value={form.localidad} onChange={(e) => set("localidad", e.target.value)} style={inputStyle} />
                </div>
              </div>
            </>
          )}



          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={fieldGroup}>
              <label style={labelStyle}>Fecha de compra</label>
              <input type="date" value={form.fechaCompra} onChange={(e) => set("fechaCompra", e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>Fecha de vencimiento</label>
              <input type="date" value={form.fechaVencimiento} onChange={(e) => set("fechaVencimiento", e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Categoría</label>
            <select value={form.categoria} onChange={(e) => set("categoria", e.target.value)} style={inputStyle} disabled={form.tipo === 'egreso' && esEdicionDesdeFicha}>
              {CATEGORIAS.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>

          {/* El campo de descripción ahora también se deshabilita si es un egreso desde la ficha */}
          <div style={fieldGroup}>
            <label style={labelStyle}>{catActual?.icon} Descripción del Artículo</label>
            {form.tipo === 'egreso' ? (
              <select
                value={form.descripcion}
                onChange={(e) => {
                  const selectedDesc = e.target.value;
                  const selectedItem = stockDisponible.find(item => item.descripcion === selectedDesc);
                  setForm(f => ({ ...f, descripcion: selectedDesc, categoria: selectedItem?.categoria || f.categoria }));
                }}
                style={inputStyle}
                disabled={esEdicionDesdeFicha}
              >
                <option value="">-- Seleccioná un artículo del inventario --</option>
                {stockDisponible.filter(item => item.stock > 0).map(item => (
                  <option key={item.id} value={item.descripcion}>
                    {item.descripcion} ({item.stock} disp.)
                  </option>
                ))}
              </select>
            ) : (
              <input type="text" placeholder={`Ej: ${catActual?.label}`} value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} style={inputStyle} disabled={esEdicionDesdeFicha} />
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={fieldGroup}>
              <label style={labelStyle}>Cantidad {form.tipo === "inicial" ? "Existente" : ""}</label>
              <input type="number" min="1" placeholder="0" value={form.cantidad} onChange={(e) => set("cantidad", e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>Unidad</label>
              <select value={form.unidad} onChange={(e) => set("unidad", e.target.value)} style={inputStyle}>
                {UNIDADES.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Observaciones</label>
            <textarea placeholder="Notas adicionales sobre este registro..." value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Estado del productoo</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { value: "Activo", label: "Activo", color: "#0F172A", bg: "#D1FAE5" },
                { value: "Dado de baja", label: "Dado de baja", color: "#B91C1C", bg: "#FEE2E2" }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => set("estado", option.value)}
                  style={{
                    flex: 1,
                    minWidth: 120,
                    padding: "10px",
                    borderRadius: 8,
                    border: `2px solid ${form.estado === option.value ? option.color : "#E2E8F0"}`,
                    background: form.estado === option.value ? option.bg : "#F8FAFC",
                    color: form.estado === option.value ? option.color : "#475569",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 12
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {form.estado === "Dado de baja" && (
            <div style={fieldGroup}>
              <label style={labelStyle}>Motivo</label>
              <select value={form.motivo} onChange={(e) => set("motivo", e.target.value)} style={inputStyle}>
                <option value="">Seleccioná un motivo</option>
                <option value="roto">roto</option>
                <option value="vencido">vencido</option>
                <option value="pérdida">pérdida</option>
                <option value="donación">donación</option>
              </select>
            </div>
          )}

          <div style={fieldGroup}>
            <label style={labelStyle}>Estado del remito</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { value: "Pendiente", label: "Pendiente", color: "#A16207", bg: "#FEF3C7" },
                { value: "Recibido", label: "Recibido", color: "#0F766E", bg: "#D1FAE5" },
                { value: "Cerrado", label: "Cerrado", color: "#1D4ED8", bg: "#DBEAFE" }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => set("estadoRemito", option.value)}
                  style={{
                    flex: 1,
                    minWidth: 120,
                    padding: "10px",
                    borderRadius: 8,
                    border: `2px solid ${form.estadoRemito === option.value ? option.color : "#E2E8F0"}`,
                    background: form.estadoRemito === option.value ? option.bg : "#F8FAFC",
                    color: form.estadoRemito === option.value ? option.color : "#475569",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 12
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {form.estadoRemito === "Cerrado" && (
            <div style={fieldGroup}>
              <label style={labelStyle}>Fecha de cierre</label>
              <input type="date" value={form.fechaCierre} onChange={(e) => set("fechaCierre", e.target.value)} style={inputStyle} />
            </div>
          )}

          {/* ── SECCIÓN MULTI-FOTO ── */}
          <div style={fieldGroup}>
            <label style={labelStyle}>📷 Fotos adjuntas ({form.listaFotos.length})</label>

            {form.listaFotos.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                {form.listaFotos.map((foto) => (
                  <div key={foto.id} style={{ position: "relative", border: "2px solid #CBD5E1", borderRadius: 10, overflow: "hidden", background: "#F1F5F9" }}>
                    {/* ✅ CORRECCIÓN: Usar siempre foto.preview para el src, que es la URL formateada y segura.
                        foto.url puede contener el ID crudo que causa el 404.
                        Si preview no existe (caso improbable), se usa la url como fallback.
                    */}
                    <img src={foto.preview || foto.url} alt="Remito adjunto" style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
                    <button 
                      type="button"
                      onClick={() => quitarFoto(foto.id)} 
                      style={{ position: "absolute", top: 4, right: 4, background: "rgba(220, 38, 38, 0.85)", border: "none", color: "#fff", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}
                      title="Quitar foto"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              onDragOver={(e) => { e.preventDefault(); setArrastrandoFoto(true); }}
              onDragLeave={() => setArrastrandoFoto(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${arrastrandoFoto ? "#2E7DC4" : "#CBD5E1"}`,
                borderRadius: 10, padding: "18px 16px", textAlign: "center",
                background: arrastrandoFoto ? "#EFF6FF" : "#F8FAFC",
                transition: "all 0.2s", marginBottom: 8,
              }}
            >
              {cargandoFoto ? (
                <div style={{ color: "#2E7DC4", fontSize: 13 }}>⏳ Procesando archivos adjuntos...</div>
              ) : (
                <>
                  <div style={{ fontSize: 26, marginBottom: 4 }}>📄📌</div>
                  <div style={{ color: "#475569", fontSize: 12, fontWeight: 600 }}>Arrastrá una o más fotos acá</div>
                  <div style={{ color: "#94A3B8", fontSize: 10, marginTop: 2 }}>Directo a tu Google Drive vinculado</div>
                </>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button
                type="button"
                onClick={() => fileInputGaleriaRef.current.click()}
                disabled={cargandoFoto}
                style={{ ...btnSecundario, fontSize: 12, padding: "10px 8px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: cargandoFoto ? 0.6 : 1 }}
              >
                🖼️ Añadir desde Galería
              </button>
              <button
                type="button"
                onClick={() => fileInputCamaraRef.current.click()}
                disabled={cargandoFoto}
                style={{ ...btnSecundario, fontSize: 12, padding: "10px 8px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: cargandoFoto ? 0.6 : 1, color: "#1A3A5C", borderColor: "#BFDBFE", background: "#EFF6FF" }}
              >
                📸 Capturar Cámara
              </button>
            </div>

            <input ref={fileInputGaleriaRef} type="file" accept="image/*" multiple onChange={handleInputChange} style={{ display: "none" }} />
            <input ref={fileInputCamaraRef} type="file" accept="image/*" capture="environment" multiple onChange={handleInputChange} style={{ display: "none" }} />
          </div>

          {error && <div style={{ color: "#DC2626", background: "#FEE2E2", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>⚠️ {error}</div>}
          {subiendo && <div style={{ color: "#2E7DC4", background: "#EFF6FF", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>⏳ Subiendo remitos a Drive y guardando datos...</div>}
        </div>

        <div style={{ padding: "14px 22px", borderTop: "1px solid #E2E8F0", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={onClose} style={{ ...btnSecundario, flex: 1, minWidth: 120 }}>Cancelar</button>
          <button type="button" onClick={handleGuardar} disabled={procesando} style={{ ...btnPrincipal, flex: 2, minWidth: 140, opacity: procesando ? 0.7 : 1 }}>
            {subiendo ? "⏳ Guardando..." : esEdicion ? "✅ Guardar Cambios" : "✅ Guardar Carga"}
          </button>
        </div>
      </div>
    </div>
  );
}