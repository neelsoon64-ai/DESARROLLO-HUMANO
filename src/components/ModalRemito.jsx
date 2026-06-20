import { useState, useRef } from "react";
import { CATEGORIAS, UNIDADES, generarId } from "../constants.js";
import { inputStyle, labelStyle, fieldGroup, btnPrincipal, btnSecundario, overlay, modal } from "../styles.js";
import { comprimirImagen, subirFotoRemito } from "../fotoStorage.js";

export default function ModalRemito({ onClose, onGuardar, seccionNombre, movimientoEditar, esEdicion }) {
  const inicial = movimientoEditar || {};
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
    fotoPreview: inicial.foto || null,
    fotoData: null, // base64 nuevo a subir (si se cambió la foto)
    fotoUrlExistente: inicial.foto || null, // URL ya subida (si no se cambió)
  });
  const [error, setError] = useState("");
  const [cargandoFoto, setCargandoFoto] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrandoFoto, setArrastrandoFoto] = useState(false);
  const fileInputGaleriaRef = useRef();
  const fileInputCamaraRef = useRef();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const procesarArchivo = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("La imagen es demasiado grande (máx. 20MB).");
      return;
    }
    setCargandoFoto(true);
    setError("");
    try {
      const data = await comprimirImagen(file);
      if (data) {
        set("fotoData", data);
        set("fotoPreview", data);
        set("fotoUrlExistente", null);
      } else {
        setError("No se pudo procesar la imagen. Intentá con otro archivo.");
      }
    } catch {
      setError("Error al cargar la imagen.");
    } finally {
      setCargandoFoto(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) procesarArchivo(file);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setArrastrandoFoto(false);
    const file = e.dataTransfer.files?.[0];
    if (file) procesarArchivo(file);
  };

  const handleGuardar = async () => {
    if (!form.descripcion.trim()) return setError("Ingresá una descripción.");
    if (!form.cantidad || isNaN(Number(form.cantidad)) || Number(form.cantidad) <= 0)
      return setError("Ingresá una cantidad válida.");
    setError("");

    const id = movimientoEditar?.id || generarId();
    let fotoFinal = form.fotoUrlExistente; // mantiene la foto vieja si no se cambió

    // Si hay una foto nueva en base64, subirla a Firebase Storage
    if (form.fotoData) {
      setSubiendo(true);
      try {
        fotoFinal = await subirFotoRemito(form.fotoData, id);
      } catch (err) {
        setSubiendo(false);
        setError("No se pudo subir la foto. Revisá tu conexión e intentá de nuevo.");
        return;
      }
      setSubiendo(false);
    } else if (form.fotoPreview === null) {
      fotoFinal = null; // se quitó la foto
    }

    onGuardar({
      ...(movimientoEditar || { id }),
      fecha: new Date(form.fecha).toISOString(),
      nroRemito: form.nroRemito,
      proveedor: form.proveedor,
      observaciones: form.observaciones,
      tipo: form.tipo,
      categoria: form.categoria,
      descripcion: form.descripcion.trim(),
      cantidad: Number(form.cantidad),
      unidad: form.unidad,
      foto: fotoFinal,
    });
    onClose();
  };

  const catActual = CATEGORIAS.find((c) => c.id === form.categoria);
  const procesando = cargandoFoto || subiendo;

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ background: esEdicion ? "linear-gradient(135deg,#C8993A,#E8B84B)" : "linear-gradient(135deg,#1A3A5C,#2E7DC4)", borderRadius: "14px 14px 0 0", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{seccionNombre}</div>
            <div style={{ color: "#fff", fontSize: 17, fontWeight: 700, marginTop: 2 }}>{esEdicion ? "✏️ Editar Movimiento" : "Nueva Carga de Remito"}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 8, width: 34, height: 34, cursor: "pointer", fontSize: 18 }}>×</button>
        </div>

        <div style={{ padding: "22px", overflowY: "auto", maxHeight: "68vh", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={fieldGroup}>
            <label style={labelStyle}>Tipo de movimiento</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ v: "ingreso", l: "📥 Ingreso" }, { v: "egreso", l: "📤 Egreso" }].map(({ v, l }) => (
                <button
                  key={v}
                  onClick={() => set("tipo", v)}
                  style={{
                    flex: 1, padding: "10px",
                    border: `2px solid ${form.tipo === v ? (v === "ingreso" ? "#059669" : "#DC2626") : "#E2E8F0"}`,
                    borderRadius: 8,
                    background: form.tipo === v ? (v === "ingreso" ? "#D1FAE5" : "#FEE2E2") : "#F8FAFC",
                    color: form.tipo === v ? (v === "ingreso" ? "#059669" : "#DC2626") : "#64748B",
                    fontWeight: 700, cursor: "pointer", fontSize: 13,
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
              <label style={labelStyle}>N° Remito</label>
              <input type="text" placeholder="REM-0001" value={form.nroRemito} onChange={(e) => set("nroRemito", e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Proveedor / Origen</label>
            <input type="text" placeholder="Nombre o procedencia" value={form.proveedor} onChange={(e) => set("proveedor", e.target.value)} style={inputStyle} />
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
            <label style={labelStyle}>{catActual?.icon} Descripción</label>
            <input type="text" placeholder={`Ej: ${catActual?.label} 2.44m`} value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={fieldGroup}>
              <label style={labelStyle}>Cantidad</label>
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
            <textarea placeholder="Notas adicionales..." value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} />
          </div>

          {/* ── SECCIÓN FOTO ── */}
          <div style={fieldGroup}>
            <label style={labelStyle}>📷 Foto del Remito</label>

            {form.fotoPreview ? (
              <div style={{ position: "relative", border: "2px solid #CBD5E1", borderRadius: 10, overflow: "hidden", background: "#F8FAFC" }}>
                <img src={form.fotoPreview} alt="Vista previa del remito" style={{ width: "100%", maxHeight: 200, objectFit: "contain", display: "block" }} />
                <div style={{ display: "flex", gap: 6, padding: 8 }}>
                  <button onClick={() => fileInputGaleriaRef.current.click()} style={{ ...btnSecundario, flex: 1, fontSize: 12, padding: "7px 10px" }}>
                    🔄 Cambiar
                  </button>
                  <button
                    onClick={() => { set("fotoPreview", null); set("fotoData", null); set("fotoUrlExistente", null); }}
                    style={{ ...btnSecundario, flex: 1, fontSize: 12, padding: "7px 10px", color: "#DC2626", borderColor: "#FCA5A5" }}
                  >
                    🗑️ Quitar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div
                  onDragOver={(e) => { e.preventDefault(); setArrastrandoFoto(true); }}
                  onDragLeave={() => setArrastrandoFoto(false)}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${arrastrandoFoto ? "#2E7DC4" : "#CBD5E1"}`,
                    borderRadius: 10, padding: "20px 16px", textAlign: "center",
                    background: arrastrandoFoto ? "#EFF6FF" : "#F8FAFC",
                    transition: "all 0.2s", marginBottom: 8,
                  }}
                >
                  {cargandoFoto ? (
                    <div style={{ color: "#2E7DC4", fontSize: 13 }}>⏳ Procesando imagen...</div>
                  ) : (
                    <>
                      <div style={{ fontSize: 32, marginBottom: 6 }}>📄</div>
                      <div style={{ color: "#475569", fontSize: 13, fontWeight: 600 }}>Arrastrá una foto acá</div>
                      <div style={{ color: "#94A3B8", fontSize: 11, marginTop: 2 }}>o usá los botones de abajo</div>
                    </>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button
                    onClick={() => fileInputGaleriaRef.current.click()}
                    disabled={cargandoFoto}
                    style={{ ...btnSecundario, fontSize: 13, padding: "10px 8px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: cargandoFoto ? 0.6 : 1 }}
                  >
                    🖼️ Elegir imagen
                  </button>
                  <button
                    onClick={() => fileInputCamaraRef.current.click()}
                    disabled={cargandoFoto}
                    style={{ ...btnSecundario, fontSize: 13, padding: "10px 8px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: cargandoFoto ? 0.6 : 1, color: "#1A3A5C", borderColor: "#BFDBFE", background: "#EFF6FF" }}
                  >
                    📸 Sacar foto
                  </button>
                </div>
              </div>
            )}

            <input ref={fileInputGaleriaRef} type="file" accept="image/*" onChange={handleInputChange} style={{ display: "none" }} />
            <input ref={fileInputCamaraRef} type="file" accept="image/*" capture="environment" onChange={handleInputChange} style={{ display: "none" }} />
          </div>

          {error && <div style={{ color: "#DC2626", background: "#FEE2E2", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>⚠️ {error}</div>}
          {subiendo && <div style={{ color: "#2E7DC4", background: "#EFF6FF", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>☁️ Subiendo foto a la nube...</div>}
        </div>

        <div style={{ padding: "14px 22px", borderTop: "1px solid #E2E8F0", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ ...btnSecundario, flex: 1 }}>Cancelar</button>
          <button onClick={handleGuardar} disabled={procesando} style={{ ...btnPrincipal, flex: 2, opacity: procesando ? 0.7 : 1 }}>
            {subiendo ? "☁️ Subiendo..." : esEdicion ? "✅ Guardar Cambios" : "✅ Guardar Carga"}
          </button>
        </div>
      </div>
    </div>
  );
}
