import { useState, useRef } from "react";
import { CATEGORIAS, UNIDADES, generarId } from "../constants.js";
import { inputStyle, labelStyle, fieldGroup, btnPrincipal, btnSecundario, overlay, modal } from "../styles.js";
import { generarPreviewDesdeArchivo, subirFotoRemito } from "../fotoStorage.js";

export default function ModalRemito({ onClose, onGuardar, seccionNombre, datosEdicion }) {
  const inicial = datosEdicion || {};
  const esEdicion = !!datosEdicion;
  
  const fotosIniciales = Array.isArray(inicial.foto) 
    ? inicial.foto 
    : (inicial.foto ? [inicial.foto] : []);

  const [form, setForm] = useState({
    fecha: inicial.fecha ? new Date(inicial.fecha).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    nroRemito: inicial.nroRemito || "",
    proveedor: inicial.proveedor || "",
    observaciones: inicial.observaciones || "",
    tipo: inicial.tipo || "ingreso", 
    categoria: inicial.categoria || CATEGORIAS[0].id,
    descripcion: inicial.descripcion || "",
    cantidad: inicial.cantidad || "",
    unidad: inicial.unidad || "unidades",
    estado: inicial.estado || "Activo",
    motivo: inicial.motivo || "",
    fechaCompra: inicial.fechaCompra ? new Date(inicial.fechaCompra).toISOString().slice(0, 10) : "",
    fechaVencimiento: inicial.fechaVencimiento ? new Date(inicial.fechaVencimiento).toISOString().slice(0, 10) : "",
    estadoRemito: inicial.estadoRemito || "Pendiente",
    fechaCierre: inicial.fechaCierre ? new Date(inicial.fechaCierre).toISOString().slice(0, 10) : "",
    listaFotos: fotosIniciales.map((foto, idx) => ({
      id: `foto-inicial-${idx}`,
      url: foto,
      preview: foto
    })),
  });

  const [cargandoFoto, setCargandoFoto] = useState(false);
  const [arrastrandoFoto, setArrastrandoFoto] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const fileInputGaleriaRef = useRef(null);
  const fileInputCamaraRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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
    if (form.estado === "Dado de baja" && !form.motivo) return setError("Seleccioná un motivo para Dado de baja.");
    if (form.estadoRemito === "Cerrado" && !form.fechaCierre) return setError("Ingresá la fecha de cierre del remito.");
    setError("");

    const id = inicial?.id || generarId();
    setSubiendo(true);

    try {
      // ─── 📝 PROCESAMIENTO Y SUBIDA EN PARALELO A TU GOOGLE DRIVE ───
      const fotosProcesadas = await Promise.all(
        form.listaFotos.map(async (f, idx) => {
          if (f.url && f.url.startsWith("http")) return f.url; 
          
          if (f.preview && f.preview.startsWith("data:image")) {
            try {
              console.log(`Subiendo adjunto index ${idx} a Google Drive...`);
              return await subirFotoRemito(f.preview, `remito_${id}_${idx}`);
            } catch (driveErr) {
              console.error("Falló la subida a Drive para esta imagen:", driveErr);
              return "";
            }
          }
          return "";
        })
      );

      // ✅ CORRECCIÓN: Filtramos para quedarnos solo con las URLs válidas.
      const fotosFinalesFiltradas = fotosProcesadas.filter(Boolean);

      // ✅ CORRECCIÓN: Si después de procesar no queda ninguna foto, y estamos editando,
      // mantenemos las fotos originales para no borrarlas accidentalmente.
      // Si es una carga nueva y no hay fotos, se guarda un string vacío.
      const fotoFinal = fotosFinalesFiltradas.length > 0
        ? (fotosFinalesFiltradas.length === 1 ? fotosFinalesFiltradas[0] : fotosFinalesFiltradas)
        : (esEdicion ? (inicial.foto || "") : "");

      console.debug("ModalRemito: Guardando payload final con enlaces limpios.", { fotoFinal });


      const proveedorFinal = form.tipo === "inicial" && !form.proveedor.trim() 
        ? "Inventario Físico Inicial" 
        : form.proveedor.trim();

      const fechaFinal = new Date(form.fecha).toISOString();

      // Determinar dinámicamente si es nacion o provincia basado en el título del modal
      const origenDetectado = seccionNombre?.toLowerCase().includes("nación") || seccionNombre?.toLowerCase().includes("nacion")
        ? "nacion"
        : "provincia";

      // ─── 🚀 ENVÍO INMUNE A TU BASE DE DATOS ───
      onGuardar({
        ...inicial,
        id,
        fecha: fechaFinal,
        fechaCarga: fechaFinal,
        origen: origenDetectado, // 🔥 ESTA LÍNEA SOLUCIONA EL FILTRADO Y GUARDADO
        nroRemito: form.nroRemito,
        proveedor: proveedorFinal,
        observaciones: form.observaciones,
        tipo: form.tipo,
        categoria: form.categoria,
        descripcion: form.descripcion.trim(),
        cantidad: Number(form.cantidad),
        unidad: form.unidad,
        estado: form.estado || "Activo",
        motivo: form.estado === "Dado de baja" ? (form.motivo || "") : "",
        fechaCompra: form.fechaCompra ? new Date(form.fechaCompra).toISOString() : null,
        fechaVencimiento: form.fechaVencimiento ? new Date(form.fechaVencimiento).toISOString() : null,
        estadoRemito: form.estadoRemito || "Pendiente",
        fechaCierre: form.estadoRemito === "Cerrado" ? (form.fechaCierre ? new Date(form.fechaCierre).toISOString() : new Date().toISOString()) : null,
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
                  type="button"
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
                    cursor: esEdicion ? "not-allowed" : "pointer", 
                    fontSize: 12,
                    transition: "all 0.2s",
                    opacity: esEdicion && form.tipo !== v ? 0.4 : 1
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
            <select value={form.categoria} onChange={(e) => set("categoria", e.target.value)} style={inputStyle}>
              {CATEGORIAS.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>{catActual?.icon} Descripción del Artículo</label>
            <input type="text" placeholder={`Ej: ${catActual?.label}`} value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} style={inputStyle} />
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
                  <div key={foto.id} style={{ position: "relative", border: "2px solid #CBD5E1", borderRadius: 10, overflow: "hidden", background: "#F8FAFC" }}>
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