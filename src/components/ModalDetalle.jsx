import { useState } from "react";
import { CATEGORIAS, formatFecha, formatFechaCorta } from "../constants.js";
import { btnPrincipal, btnSecundario, overlay, modal } from "../styles.js";
import { InfoItem } from "./Common.jsx";

export default function ModalDetalle({ mov, onClose, esAdmin, onEditar, onEliminar }) {
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const cat = CATEGORIAS.find((c) => c.id === mov.categoria);
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

            <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 18px 45px rgba(15,23,42,0.06)" }}>
              <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F1F5F9" }}>
                <div>
                  <div style={{ color: "#0F172A", fontSize: 13, fontWeight: 800 }}>Imagen del remito</div>
                  <div style={{ color: "#64748B", fontSize: 11, marginTop: 4 }}>Pulse para ampliar</div>
                </div>
                {mov.foto && (
                  <button
                    onClick={() => setZoomOpen(true)}
                    style={{ border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A", borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                  >
                    🔎 Ampliar
                  </button>
                )}
              </div>
              <div style={{ padding: 18, display: "flex", justifyContent: "center", background: "#F8FAFC" }}>
                {mov.foto ? (
                  <img
                    src={mov.foto}
                    alt="Remito"
                    style={{ width: "100%", maxWidth: 500, maxHeight: 360, borderRadius: 18, objectFit: "contain", cursor: "zoom-in" }}
                    onClick={() => {
                      setZoomLevel(1);
                      setZoomOpen(true);
                    }}
                  />
                ) : (
                  <div style={{ width: "100%", maxWidth: 500, minHeight: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", background: "#F1F5F9", borderRadius: 18, border: "1px dashed #CBD5E1" }}>
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

      {zoomOpen && (
        <div
          onClick={() => {
            setZoomLevel(1);
            setZoomOpen(false);
          }}
          style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(15,23,42,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: "relative", width: "100%", maxWidth: 940, maxHeight: "90vh", borderRadius: 26, overflow: "auto", boxShadow: "0 32px 120px rgba(15,23,42,0.35)" }}
          >
            <div style={{ position: "absolute", top: 18, left: 18, zIndex: 11, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => setZoomLevel((prev) => Math.max(prev - 0.25, 1))}
                style={{ border: "none", background: "rgba(255,255,255,0.94)", color: "#0F172A", borderRadius: 16, padding: "10px 14px", cursor: "pointer", fontWeight: 700, boxShadow: "0 10px 28px rgba(15,23,42,0.18)" }}
              >
                −
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                style={{ border: "none", background: "rgba(255,255,255,0.94)", color: "#0F172A", borderRadius: 16, padding: "10px 14px", cursor: "pointer", fontWeight: 700, boxShadow: "0 10px 28px rgba(15,23,42,0.18)" }}
              >
                100%
              </button>
              <button
                onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 3))}
                style={{ border: "none", background: "rgba(255,255,255,0.94)", color: "#0F172A", borderRadius: 16, padding: "10px 14px", cursor: "pointer", fontWeight: 700, boxShadow: "0 10px 28px rgba(15,23,42,0.18)" }}
              >
                +
              </button>
            </div>
            <img
              src={mov.foto}
              alt="Remito ampliado"
              style={{ width: "100%", maxWidth: "100%", height: "auto", maxHeight: "none", objectFit: "contain", background: "#111827", transform: `scale(${zoomLevel})`, transformOrigin: "center top", transition: "transform 0.2s ease" }}
              onWheel={(e) => {
                e.preventDefault();
                if (e.deltaY < 0) {
                  setZoomLevel((prev) => Math.min(prev + 0.1, 3));
                } else {
                  setZoomLevel((prev) => Math.max(prev - 0.1, 1));
                }
              }}
            />
            <button
              style={{
                position: "absolute",
                top: 18,
                right: 18,
                border: "none",
                background: "rgba(255,255,255,0.94)",
                color: "#0F172A",
                borderRadius: 16,
                padding: "10px 14px",
                cursor: "pointer",
                fontWeight: 700,
                boxShadow: "0 10px 28px rgba(15,23,42,0.18)",
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
