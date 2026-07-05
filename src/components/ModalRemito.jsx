import { useState, useEffect } from "react";
import { CATEGORIAS, formatFecha, formatFechaCorta } from "../constants.js";
import { btnPrincipal, btnSecundario, overlay, modal } from "../styles.js";
import { InfoItem } from "./Common.jsx";
// 📄 Importamos la función encargada de armar el PDF oficial de Desarrollo Humano
import { imprimirRemitoOficial } from "./ImpresorRemito.js";

// ✅ Función Helper para extraer el ID correcto e impedir URLs duplicadas/corruptas
const formatearUrlDrive = (idOrUrl) => {
  if (!idOrUrl || typeof idOrUrl !== "string") return "";
  
  // Si ya es un base64 o no pertenece a Google Drive, lo dejamos pasar intacto
  if (idOrUrl.startsWith("data:") || !idOrUrl.includes("google")) {
    return idOrUrl;
  }

  // Expresión regular robusta para capturar el ID de cualquier formato de link de Drive
  const matchId = idOrUrl.match(/(?:id=|\/d\/)([a-zA-Z0-9-_]+)/);
  if (matchId && matchId[1]) {
    return `https://drive.google.com/thumbnail?id=${matchId[1]}&sz=w800`;
  }

  // Si no hizo match pero no tiene barras de URL, asumimos que es el ID puro
  if (!idOrUrl.includes("/")) {
    return `https://drive.google.com/thumbnail?id=${idOrUrl}&sz=w800`;
  }

  return idOrUrl;
};

export default function ModalDetalle({ mov, onClose, puedeEditar, onEditar, puedeEliminar, onEliminar }) {
  // Control de seguridad: Si no hay movimiento, evitamos romper el render de la app
  if (!mov) return null;

  // ✅ CORREGIDO: Ahora procesamos y limpiamos las imágenes de forma segura con la función helper
  const fotosArray = Array.isArray(mov.foto) 
    ? mov.foto.map(item => formatearUrlDrive(item))
    : (mov.foto ? [formatearUrlDrive(mov.foto)] : []);

  const [zoomOpen, setZoomOpen] = useState(false);
  const [fotoSeleccionada, setFotoSeleccionada] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const cat = CATEGORIAS.find((c) => c.id === mov.categoria);

  // Sincroniza la foto seleccionada de manera segura una vez que el componente monta o cambia
  useEffect(() => {
    if (fotosArray.length > 0) {
      setFotoSeleccionada(fotosArray[0]);
    }
  }, [mov]);

  const abrirZoom = (fotoUrl) => {
    setFotoSeleccionada(fotoUrl);
    setZoomLevel(1);
    setZoomOpen(true);
  };

  return (
    <>
      <div style={overlay}>
        <div style={{ ...modal, maxWidth: 540, padding: 0, overflow: "hidden", borderRadius: 24 }}>
          <div style={{ background: mov.tipo === "ingreso" ? "linear-gradient(135deg,#0D714C,#10B981)" : "linear-gradient(135deg,#B91C1C,#F97316)", padding: "24px 26px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
                {mov.tipo === "ingreso" ? "Remito de ingreso" : "Remito de egreso"}
              </div>
              <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginTop: 8, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {mov.descripcion}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
                <span style={{ background: "rgba(255,255,255,0.16)", color: "#F8FAFC", padding: "6px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
                  {cat?.icon} {cat?.label}
                </span>
                {mov.nroRemito && (
                  <span style={{ background: "rgba(255,255,255,0.16)", color: "#F8FAFC", padding: "6px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
                    N° {mov.nroRemito}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.22)", border: "none", color: "#fff", borderRadius: 12, width: 38, height: 38, cursor: "pointer", fontSize: 20, fontWeight: 700, lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          <div style={{ padding: "22px 26px 18px", display: "grid", gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              <div style={{ background: "#F8FAFC", borderRadius: 18, padding: 16, border: "1px solid #E2E8F0" }}>
                <div style={{ color: "#64748B", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Fecha</div>
                <div style={{ color: "#0F172A", fontSize: 14, fontWeight: 700 }}>{formatFecha(mov.fecha)}</div>
              </div>
              <div style={{ background: "#F8FAFC", borderRadius: 18, padding: 16, border: "1px solid #E2E8F0" }}>
                <div style={{ color: "#64748B", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Cantidad</div>
                <div style={{ color: "#0F172A", fontSize: 14, fontWeight: 700 }}>{mov.cantidad} {mov.unidad}</div>
              </div>
              {mov.fechaVencimiento && (
                <div style={{ background: new Date(mov.fechaVencimiento) < new Date() ? "#FEF2F2" : "#F8FAFC", borderRadius: 18, padding: 16, border: "1px solid #E2E8F0" }}>
                  <div style={{ color: new Date(mov.fechaVencimiento) < new Date() ? "#B91C1C" : "#64748B", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Fecha de Vencimiento</div>
                  <div style={{ color: new Date(mov.fechaVencimiento) < new Date() ? "#991B1B" : "#0F172A", fontSize: 14, fontWeight: 700 }}>{formatFechaCorta(mov.fechaVencimiento)}</div>
                </div>
              )}
              <div style={{ background: "#F8FAFC", borderRadius: 18, padding: 16, border: "1px solid #E2E8F0" }}>
                <div style={{ color: "#64748B", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Proveedor</div>
                <div style={{ color: "#0F172A", fontSize: 14, fontWeight: 700 }}>{mov.proveedor || "No informado"}</div>
              </div>
              <div style={{ background: "#F8FAFC", borderRadius: 18, padding: 16, border: "1px solid #E2E8F0" }}>
                <div style={{ color: "#64748B", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Cargado por</div>
                <div style={{ color: "#0F172A", fontSize: 14, fontWeight: 700 }}>{mov.cargadoPor || "Desconocido"}</div>
              </div>
              {mov.editadoPor && (
                <div style={{ background: "#F8FAFC", borderRadius: 18, padding: 16, border: "1px solid #E2E8F0", gridColumn: "span 2" }}>
                  <div style={{ color: "#64748B", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Última edición</div>
                  <div style={{ color: "#0F172A", fontSize: 14, fontWeight: 700 }}>{mov.editadoPor}</div>
                  <div style={{ color: "#64748B", fontSize: 12, marginTop: 6 }}>{formatFechaCorta(mov.fechaEdicion)}</div>
                </div>
              )}
              <div style={{ background: mov.estado === "Dado de baja" ? "#FEE2E2" : "#F8FAFC", borderRadius: 18, padding: 16, border: "1px solid #E2E8F0", gridColumn: "span 2" }}>
                <div style={{ color: "#64748B", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Estado</div>
                <div style={{ color: mov.estado === "Dado de baja" ? "#991B1B" : "#0F172A", fontSize: 14, fontWeight: 700 }}>{mov.estado || "Activo"}</div>
                {mov.motivo && <div style={{ color: "#475569", fontSize: 12, marginTop: 6 }}>Motivo: {mov.motivo}</div>}
              </div>
            </div>

            {mov.observaciones && (
              <div style={{ background: "#F8FAFC", borderRadius: 18, padding: 18, border: "1px solid #E2E8F0" }}>
                <div style={{ color: "#334155", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Observaciones</div>
                <div style={{ color: "#475569", fontSize: 14, lineHeight: 1.7 }}>{mov.observaciones}</div>
              </div>
            )}

            {/* ── SECCIÓN IMÁGENES DEL REMITO ── */}
            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 18px 45px rgba(15,23,42,0.06)" }}>
              <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F1F5F9" }}>
                <div>
                  <div style={{ color: "#0F172A", fontSize: 13, fontWeight: 800 }}>Imágenes del remito ({fotosArray.length})</div>
                  <div style={{ color: "#64748B", fontSize: 11, marginTop: 4 }}>Pulse sobre cualquier captura para ampliar</div>
                </div>
                {fotosArray.length > 0 && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      onClick={() => abrirZoom(fotosArray[0])}
                      style={{ border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A", borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                    >
                      🔎 Ampliar
                    </button>
                    <button
                      onClick={() => window.open(fotosArray[0], "_blank")}
                      style={{ border: "1px solid #E2E8F0", background: "#fff", color: "#0F172A", borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                    >
                      🌐 Abrir en pestaña
                    </button>
                  </div>
                )}
              </div>
              
              <div style={{ padding: 18, background: "#F8FAFC" }}>
                {fotosArray.length > 0 ? (
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: fotosArray.length === 1 ? "1fr" : "1fr 1fr", 
                    gap: 12,
                    maxHeight: 380,
                    overflowY: "auto"
                  }}>
                    {fotosArray.map((fotoUrl, index) => (
                      <img
                        key={index}
                        src={fotoUrl}
                        alt={`Parte del remito ${index + 1}`}
                        style={{ 
                          width: "100%", 
                          height: fotosArray.length === 1 ? "auto" : 140, 
                          maxHeight: 340,
                          borderRadius: 14, 
                          objectFit: "cover", 
                          cursor: "zoom-in",
                          border: "1px solid #CBD5E1",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
                        }}
                        onClick={() => abrirZoom(fotoUrl)}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ width: "100%", maxWidth: 500, minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", background: "#F1F5F9", borderRadius: 18, border: "1px dashed #CBD5E1" }}>
                    No hay imagen cargada
                  </div>
                )}
              </div>
            </div>

            {/* ── PANEL DE ACCIONES CON BOTÓN DE IMPRESIÓN OFICIAL INTEGRADO ── */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flexDirection: "column" }}>
              
              {/* Botón de Impresión de Reporte Oficial (Full Width para jerarquía institucional) */}
              <button
                onClick={() => imprimirRemitoOficial(mov)}
                style={{
                  background: "linear-gradient(135deg, #0284c7, #0369a1)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 16,
                  padding: "14px 20px",
                  fontWeight: "bold",
                  fontSize: 14,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 12px rgba(2, 132, 199, 0.2)",
                  transition: "transform 0.1s ease"
                }}
              >
                📄 Generar Remito Oficial (PDF)
              </button>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", width: "100%" }}>
                {puedeEditar && (
                  <button onClick={onEditar} style={{ ...btnSecundario, flex: 1, minWidth: 120, color: "#0F172A", borderColor: "#CBD5E1" }}>
                    ✏️ Editar
                  </button>
                )}
                {puedeEliminar && (
                  <button onClick={() => { if (confirm(`¿Confirmás eliminar "${mov.descripcion}"?`)) { onEliminar && onEliminar(mov); onClose(); } }} style={{ background: "#FEE2E2", color: "#B91C1C", border: "1px solid #FCA5A5", borderRadius: 12, padding: "12px", cursor: "pointer", fontWeight: 700 }}>
                    🗑️ Eliminar
                  </button>
                )}
                <button onClick={onClose} style={{ ...btnPrincipal, flex: 1, minWidth: 120 }}>
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── VISOR DE ZOOM REPARADO Y OPTIMIZADO PARA PC ── */}
      {zoomOpen && (
        <div
          onClick={() => {
            setZoomLevel(1);
            setZoomOpen(false);
          }}
          style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(15,23,42,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 20px" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ 
              position: "relative", 
              width: "100%", 
              maxWidth: "1050px", 
              height: "88vh", 
              borderRadius: 20, 
              overflow: "auto", 
              boxShadow: "0 25px 70px rgba(0,0,0,0.5)", 
              background: "#090D16",
              border: "1px solid rgba(255,255,255,0.08)"
            }}
          >
            {/* Controles superiores fijos (Sticky) */}
            <div style={{ 
              position: "sticky", 
              top: 0, 
              left: 0, 
              right: 0, 
              zIndex: 100, 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              padding: "12px 20px", 
              background: "#0F172A",
              borderBottom: "1px solid rgba(255,255,255,0.1)"
            }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={() => setZoomLevel((prev) => Math.max(prev - 0.25, 1))}
                  style={{ border: "none", background: "#334155", color: "#fff", borderRadius: 8, width: 34, height: 34, cursor: "pointer", fontWeight: 700, fontSize: 16 }}
                >
                  −
                </button>
                <span style={{ color: "#94A3B8", fontSize: 13, minWidth: 60, textAlign: "center", fontWeight: 600 }}>
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 4))}
                  style={{ border: "none", background: "#334155", color: "#fff", borderRadius: 8, width: 34, height: 34, cursor: "pointer", fontWeight: 700, fontSize: 16 }}
                >
                  +
                </button>
                {zoomLevel > 1 && (
                  <button
                    onClick={() => setZoomLevel(1)}
                    style={{ border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", borderRadius: 8, padding: "0 12px", height: 34, cursor: "pointer", fontSize: 12 }}
                  >
                    Restablecer
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  setZoomLevel(1);
                  setZoomOpen(false);
                }}
                style={{ border: "none", background: "#EF4444", color: "#fff", borderRadius: 8, padding: "0 16px", height: 34, cursor: "pointer", fontWeight: 700, fontSize: 12 }}
              >
                Cerrar Vista
              </button>
            </div>
            
            {/* Contenedor del scroll dinámico */}
            <div 
              onWheel={(e) => {
                if (e.deltaY < 0) {
                  setZoomLevel((prev) => Math.min(prev + 0.25, 4));
                } else {
                  setZoomLevel((prev) => Math.max(prev - 0.25, 1));
                }
              }}
              style={{ 
                padding: "40px",
                minWidth: "100%",
                minHeight: "calc(100% - 60px)",
                display: zoomLevel > 1 ? "block" : "flex", 
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <div style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: "0 0", 
                transition: "transform 0.12s ease-out",
                display: "block",
                margin: zoomLevel > 1 ? "0" : "auto"
              }}>
                {fotoSeleccionada ? (
                  <img
                    src={fotoSeleccionada}
                    alt="Remito ampliado"
                    style={{ 
                      maxWidth: "100%", 
                      height: "auto", 
                      maxHeight: "72vh", 
                      objectFit: "contain",
                      borderRadius: 6,
                      display: "block"
                    }}
                  />
                ) : (
                  <div style={{ color: "#64748B", textAlign: "center" }}>Cargando captura...</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}