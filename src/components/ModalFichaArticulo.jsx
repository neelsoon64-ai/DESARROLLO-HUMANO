import React, { useEffect, useState } from "react";
import { formatFechaHora } from "../constants.js";
import { movimientosConStockResultante } from "../inventoryModel.js";
import { modal, overlay } from "../styles.js";

const tipoMovimiento = (tipo) => {
  const normalizado = String(tipo || "").toLocaleLowerCase();
  if (["ingreso", "entrada", "inicial"].includes(normalizado)) return "Ingreso";
  if (["egreso", "salida"].includes(normalizado)) return "Egreso";
  if (normalizado === "ajuste") return "Ajuste";
  return tipo || "Movimiento";
};

const valor = (dato) => dato || "—";

export default function ModalFichaArticulo({ articulo, stockDetallado = [], onClose }) {
  const [registroSeleccionado, setRegistroSeleccionado] = useState(articulo?.stockKey || "");

  useEffect(() => {
    setRegistroSeleccionado(articulo?.stockKey || "");
  }, [articulo?.stockKey, articulo?.articuloId]);

  if (!articulo) return null;

  const registros = stockDetallado.filter((item) => item.articuloId === articulo.articuloId);
  const registro = registros.find((item) => item.stockKey === registroSeleccionado) ||
    (!articulo.stockKey && registros.length === 1 ? registros[0] : null);
  const movimientos = registro
    ? movimientosConStockResultante(registro.movimientos)
    : [];
  const primerIngreso = [...movimientos]
    .reverse()
    .find((movimiento) => ["ingreso", "entrada", "inicial"].includes(String(movimiento.tipo || "").toLocaleLowerCase()));
  const mostrarSelector = !articulo.stockKey && !registro && registros.length > 1;

  return (
    <div style={{ ...overlay, zIndex: 500 }} onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-ficha-articulo"
        style={{ ...modal, width: "min(900px, calc(100vw - 24px))", maxWidth: 900, maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        <header style={{ background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", borderRadius: "14px 14px 0 0", padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{articulo.categoria || "General"}</div>
            <h2 id="titulo-ficha-articulo" style={{ color: "#fff", fontSize: 18, margin: "3px 0 0" }}>{articulo.descripcion || "Detalle del artículo"}</h2>
          </div>
          <button type="button" aria-label="Cerrar detalle" onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: 0, color: "#fff", borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 20 }}>×</button>
        </header>

        <div style={{ padding: 20, overflowY: "auto" }}>
          {mostrarSelector && (
            <section aria-label="Registros separados del artículo">
              <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>Elegí el expediente o compra para consultar</h3>
              <p style={{ color: "#64748B", fontSize: 13, margin: "0 0 12px" }}>
                El producto tiene varios registros. Se muestran por separado para no mezclar sus movimientos ni saldos.
              </p>
              <div style={{ display: "grid", gap: 8 }}>
                {registros.map((item) => (
                  <button
                    type="button"
                    key={item.stockKey}
                    onClick={() => setRegistroSeleccionado(item.stockKey)}
                    style={{ textAlign: "left", background: "#fff", border: "1px solid #CBD5E1", borderRadius: 9, padding: 12, cursor: "pointer" }}
                  >
                    <strong>{item.compraId ? `Exp. ${valor(item.numero_expediente)} · Compra ${item.orden_compra || item.compraId}` : "Histórico pendiente de identificar"}</strong>
                    <div style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}>
                      {item.origen === "nacion" ? "Nación" : "Provincia"}
                      {item.nroRemito ? ` · Remito ${item.nroRemito}` : ""}
                      {` · Stock ${item.stock} ${item.unidad}`}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {!registro && !mostrarSelector && (
            <div role="status" style={{ padding: 24, textAlign: "center", color: "#64748B" }}>
              Este registro ya no está disponible en los datos sincronizados de Firebase.
            </div>
          )}

          {registro && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 10, marginBottom: 16 }}>
                <Dato label="Expediente" value={valor(registro.numero_expediente)} />
                <Dato label="Compra" value={registro.orden_compra || registro.compraId || "No identificada"} />
                <Dato label="Remito" value={valor(registro.nroRemito)} />
                <Dato label="Fecha de ingreso" value={formatFechaHora(primerIngreso?.fechaCarga || primerIngreso?.fecha)} />
                <Dato label="Fecha de compra" value={formatFechaHora(registro.fechaCompra)} />
                <Dato label="Ingresos" value={`${registro.ingresos} ${registro.unidad}`} />
                <Dato label="Egresos" value={`${registro.egresos} ${registro.unidad}`} />
                <Dato label="Stock disponible" value={`${registro.stock} ${registro.unidad}`} />
              </div>

              {!articulo.stockKey && registros.length > 1 && (
                <button type="button" onClick={() => setRegistroSeleccionado("")} style={{ border: 0, background: "transparent", color: "#1D4ED8", padding: "4px 0 12px", cursor: "pointer", fontWeight: 700 }}>
                  ← Volver a los registros del artículo
                </button>
              )}

              <h3 style={{ fontSize: 15, margin: "8px 0 10px" }}>Historial de movimientos de este registro</h3>
              <div style={{ overflowX: "auto", border: "1px solid #E5E7EB", borderRadius: 8 }}>
                <table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E5E7EB" }}>
                      {["Fecha y hora", "Tipo", "Cantidad", "Stock resultante", "Remito / comprobante", "Usuario", "Observaciones"].map((titulo) => (
                        <th key={titulo} style={{ padding: 9, color: "#475569" }}>{titulo}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((movimiento, indice) => (
                      <tr key={`${movimiento.origen || registro.origen}:${movimiento.id || indice}`} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: 9, whiteSpace: "nowrap" }}>{formatFechaHora(movimiento.fechaCarga || movimiento.fecha)}</td>
                        <td style={{ padding: 9 }}>{tipoMovimiento(movimiento.tipo)}</td>
                        <td style={{ padding: 9, whiteSpace: "nowrap" }}>{movimiento.cantidad} {movimiento.unidad || registro.unidad}</td>
                        <td style={{ padding: 9 }}>{movimiento.stockResultante === null ? "—" : `${movimiento.stockResultante} ${movimiento.unidad || registro.unidad}`}</td>
                        <td style={{ padding: 9 }}>{valor(movimiento.nroRemito || movimiento.comprobante || movimiento.orden_compra)}</td>
                        <td style={{ padding: 9 }}>{valor(movimiento.cargadoPor)}</td>
                        <td style={{ padding: 9 }}>{valor(movimiento.observaciones || movimiento.motivo)}</td>
                      </tr>
                    ))}
                    {movimientos.length === 0 && (
                      <tr><td colSpan="7" style={{ padding: 20, textAlign: "center", color: "#64748B" }}>No hay movimientos asociados a este registro.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Dato({ label, value }) {
  return (
    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 10 }}>
      <div style={{ color: "#64748B", fontSize: 11, fontWeight: 700 }}>{label}</div>
      <div style={{ color: "#111827", fontSize: 14, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}
