import { useState } from "react";
import { CATEGORIAS, formatFecha, formatFechaCorta } from "../constants.js";
import { btnPrincipal, btnSecundario, overlay, modal } from "../styles.js";
import { InfoItem } from "./Common.jsx";

export default function ModalDetalle({ mov, onClose, esAdmin, onEditar, onEliminar }) {
  // Convertimos mov.foto a un array estandarizado para iterar sin problemas
  const fotosArray = Array.isArray(mov.foto) 
    ? mov.foto 
    : (mov.foto ? [mov.foto] : []);

  const [zoomOpen, setZoomOpen] = useState(false);
  const [fotoSeleccionada, setFotoSeleccionada] = useState(fotosArray[0] || null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const cat = CATEGORIAS.find((c) => c.id === mov.categoria);

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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 14 }}>
              <div style={{ background: "#F8FAFC", borderRadius: 18, padding: 16, border: "1px solid #E2E8F0" }}>
                <div style={{ color: "#64748B", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Fecha</div>
                <div style={{ color: "#0F172A", fontSize: 14, fontWeight: 700 }}>{formatFecha(mov.fecha)}</div>
              </div>
              <div style={{ background: "#F8FAFC", borderRadius: 18, padding: 16, border: "1px solid #E2E8F0" }}>
                <div style={{ color: "#64748B", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Cantidad</div>
                <div style={{ color: "#0F172A", fontSize: 14, fontWeight: 700 }}>{mov.cantidad} {mov.unidad}</div>
              </div>
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
                  <button
                    onClick={() => abrirZoom(fotosArray[0])}
                    style={{ border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A", borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                  >
                    🔎 Ampliar
                  </button>
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

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {esAdmin && (
                <button onClick={onEditar} style={{ ...btnSecundario, flex: 1, minWidth: 150, color: "#0F172A", borderColor: "#CBD5E1" }}>
                  ✏️ Editar
                </button>
              )}
              {esAdmin && (
                <button onClick={onEliminar} style={{ ...btnSecundario, flex: 1, minWidth: 150, color: "#B91C1C", borderColor: "#FCA5A5" }}>
                  🗑️ Eliminar
                </button>
              )}
              <button onClick={onClose} style={{ ...btnPrincipal, flex: 1, minWidth: 150 }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL DE ZOOM OPTIMIZADO PARA COMPUTADORAS ── */}
      {zoomOpen && (
        <div
          onClick={() => {
            setZoomLevel(1);
            setZoomOpen(false);
          }}
          style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(15,23,42,0.9)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ 
              position: "relative", 
              width: "100%", 
              maxWidth: "960px", 
              height: "85vh", 
              borderRadius: 24, 
              overflow: "auto", // Maneja el scroll general perfectamente al agrandar la foto
              boxShadow: "0 32px 120px rgba(15,23,42,0.5)", 
              background: "#0F172A",
              border: "1px solid rgba(255,255,255,0.1)"
            }}
          >
            {/* Barra de controles superior fija usando Sticky */}
            <div style={{ 
              position: "sticky", 
              top: 0, 
              left: 0, 
              right: 0, 
              zIndex: 100, 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              padding: "14px 20px", 
              background: "linear-gradient(to bottom, rgba(15,23,42,0.95), rgba(15,23,42,0.8))",
              backdropFilter: "blur(8px)",
              borderBottom: "1px solid rgba(255,255,255,0.08)"
            }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setZoomLevel((prev) => Math.max(prev - 0.25, 1))}
                  style={{ border: "none", background: "#fff", color: "#0F172A", borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontWeight: 700, fontSize: 16 }}
                  title="Alejar"
                >
                  −
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  style={{ border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 10, padding: "0 14px", height: 36, cursor: "pointer", fontWeight: 600, fontSize: 12 }}
                >
                  Restablecer ({Math.round(zoomLevel * 100)}%)
                </button>
                <button
                  onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 4))} // Incrementado a un máximo de 400%
                  style={{ border: "none", background: "#fff", color: "#0F172A", borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontWeight: 700, fontSize: 16 }}
                  title="Acercar"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => {
                  setZoomLevel(1);
                  setZoomOpen(false);
                }}
                style={{ border: "none", background: "#EF4444", color: "#fff", borderRadius: 10, padding: "0 16px", height: 36, cursor: "pointer", fontWeight: 700, fontSize: 12 }}
              >
                Cerrar Vista
              </button>
            </div>
            
            {/* Contenedor dinámico de dimensiones calculadas según escala */}
            <div 
              onWheel={(e) => {
                if (e.deltaY < 0) {
                  setZoomLevel((prev) => Math.min(prev + 0.15, 4));
                } else {
                  setZoomLevel((prev) => Math.max(prev - 0.15, 1));
                }
              }}
              style={{ 
                padding: "30px",
                minHeight: "calc(100% - 65px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: zoomLevel > 1 ? "zoom-out" : "zoom-in"
              }}
              onClick={() => setZoomLevel(prev => prev > 1 ? 1 : 2)} // Click rápido para alternar zoom básico
            >
              <div style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: "center center",
                transition: "transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)",
                display: "inline-block"
              }}>
                <img
                  src={fotoSeleccionada}
                  alt="Remito ampliado"
                  style={{ 
                    maxWidth: "100%", 
                    height: "auto", 
                    maxHeight: "70vh", 
                    objectFit: "contain",
                    borderRadius: 8,
                    boxShadow: zoomLevel > 1 ? "0 20px 50px rgba(0,0,0,0.5)" : "none"
                  }}
                />
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}