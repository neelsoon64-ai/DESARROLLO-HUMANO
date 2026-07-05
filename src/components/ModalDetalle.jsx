import { useState, useEffect } from "react";
import { CATEGORIAS, formatFecha, formatFechaCorta } from "../constants.js";
import { btnPrincipal, btnSecundario, overlay, modal } from "../styles.js";
import { imprimirRemitoOficial } from "./ImpresorRemito.js";

export default function ModalDetalle({
  mov,
  onClose,
  puedeEditar,
  onEditar,
  puedeEliminar,
  onEliminar
}) {
  if (!mov) return null;

  // 🔧 Normaliza imagen (Drive ID o URL directa)
  const normalizarFoto = (foto) => {
    if (!foto) return "";

    if (typeof foto !== "string") return "";

    if (foto.startsWith("http://") || foto.startsWith("https://")) {
      return foto;
    }

    return `https://drive.google.com/thumbnail?id=${foto}&sz=w1200`;
  };

  const fotosArray = Array.isArray(mov.foto)
    ? mov.foto.map(normalizarFoto)
    : mov.foto
    ? [normalizarFoto(mov.foto)]
    : [];

  const [zoomOpen, setZoomOpen] = useState(false);
  const [fotoSeleccionada, setFotoSeleccionada] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const cat = CATEGORIAS.find((c) => c.id === mov.categoria);

  // 🔧 sincronización correcta
  useEffect(() => {
    if (fotosArray.length > 0) {
      setFotoSeleccionada(fotosArray[0]);
    } else {
      setFotoSeleccionada(null);
    }
  }, [fotosArray]);

  const abrirZoom = (fotoUrl) => {
    setFotoSeleccionada(fotoUrl);
    setZoomLevel(1);
    setZoomOpen(true);
  };

  return (
    <>
      {/* ───────── MODAL PRINCIPAL ───────── */}
      <div style={overlay}>
        <div
          style={{
            ...modal,
            maxWidth: 540,
            padding: 0,
            overflow: "hidden",
            borderRadius: 24
          }}
        >
          {/* HEADER */}
          <div
            style={{
              background:
                mov.tipo === "ingreso"
                  ? "linear-gradient(135deg,#0D714C,#10B981)"
                  : "linear-gradient(135deg,#B91C1C,#F97316)",
              padding: "24px 26px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>
                {mov.descripcion}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
                <span style={{ background: "rgba(255,255,255,0.16)", color: "#fff", padding: "6px 12px", borderRadius: 999 }}>
                  {cat?.icon} {cat?.label}
                </span>

                {mov.nroRemito && (
                  <span style={{ background: "rgba(255,255,255,0.16)", color: "#fff", padding: "6px 12px", borderRadius: 999 }}>
                    N° {mov.nroRemito}
                  </span>
                )}
              </div>
            </div>

            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: 0, color: "#fff", borderRadius: 10, width: 38, height: 38 }}>
              ×
            </button>
          </div>

          {/* BODY */}
          <div style={{ padding: 22, display: "grid", gap: 14 }}>
            <div style={{ fontSize: 14 }}>
              <b>Fecha:</b> {formatFecha(mov.fecha)}
            </div>

            <div style={{ fontSize: 14 }}>
              <b>Cantidad:</b> {mov.cantidad} {mov.unidad}
            </div>

            <div style={{ fontSize: 14 }}>
              <b>Proveedor:</b> {mov.proveedor || "No informado"}
            </div>

            {/* IMÁGENES */}
            <div>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>
                Imágenes ({fotosArray.length})
              </div>

              {fotosArray.length > 0 ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {fotosArray.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      onClick={() => abrirZoom(img)}
                      style={{
                        width: "100%",
                        borderRadius: 10,
                        cursor: "zoom-in",
                        objectFit: "contain",
                        border: "1px solid #ddd"
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div>No hay imágenes</div>
              )}
            </div>

            {/* BOTONES */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => imprimirRemitoOficial(mov)}
                style={{
                  flex: 1,
                  background: "#0284c7",
                  color: "#fff",
                  border: 0,
                  borderRadius: 10,
                  padding: 12
                }}
              >
                PDF Oficial
              </button>

              {puedeEditar && (
                <button
                  onClick={() => onEditar(mov)}   // 🔥 FIX CLAVE
                  style={{ ...btnSecundario, flex: 1 }}
                >
                  Editar
                </button>
              )}

              {puedeEliminar && (
                <button
                  onClick={() => {
                    if (confirm("¿Eliminar?")) {
                      onEliminar?.(mov);
                      onClose();
                    }
                  }}
                  style={{
                    flex: 1,
                    background: "#fee2e2",
                    color: "#b91c1c",
                    border: "1px solid #fca5a5",
                    borderRadius: 10
                  }}
                >
                  Eliminar
                </button>
              )}

              <button onClick={onClose} style={{ ...btnPrincipal, flex: 1 }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ───────── ZOOM ───────── */}
      {zoomOpen && (
        <div
          onClick={() => {
            setZoomOpen(false);
            setZoomLevel(1);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <img
            src={fotoSeleccionada}
            alt=""
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              transform: `scale(${zoomLevel})`,
              transition: "0.2s"
            }}
          />
        </div>
      )}
    </>
  );
}