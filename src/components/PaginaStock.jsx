import React, { useMemo, useState } from "react";
import { filtrarInventario } from "../inventoryModel.js";

const campo = {
  flex: "1 1 160px",
  minWidth: 150,
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #D1D5DB",
  fontSize: 13,
  background: "#fff",
};

export default function PaginaStock({
  stockConsolidado,
  stockDetallado = [],
  onAbrirFicha,
  onAbrirEgreso,
  onVerHistorial,
}) {
  const [vista, setVista] = useState("general");
  const [busquedaArticulo, setBusquedaArticulo] = useState("");
  const [busquedaExpediente, setBusquedaExpediente] = useState("");
  const [busquedaCompra, setBusquedaCompra] = useState("");
  const [busquedaRemito, setBusquedaRemito] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");

  const categoriasUnicas = useMemo(
    () => ["Todas", ...new Set(stockConsolidado.map((item) => item.categoria || "General"))],
    [stockConsolidado]
  );
  const items = vista === "detalle" ? stockDetallado : stockConsolidado;

  const stockFiltrado = filtrarInventario(items, {
    articulo: busquedaArticulo,
    expediente: busquedaExpediente,
    compra: busquedaCompra,
    remito: busquedaRemito,
    categoria: categoriaFiltro,
  });

  const limpiarFiltros = () => {
    setBusquedaArticulo("");
    setBusquedaExpediente("");
    setBusquedaCompra("");
    setBusquedaRemito("");
    setCategoriaFiltro("Todas");
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 16 }}>Inventario general</h1>
      {onVerHistorial && (
        <div style={{ marginBottom: 16 }}>
          <button onClick={onVerHistorial} style={{ background: "#1D4ED8", color: "#fff", border: 0, borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Ver historial de movimientos
          </button>
        </div>
      )}

      <div style={{ padding: 12, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={() => setVista("general")} style={{ border: 0, borderRadius: 8, padding: "8px 12px", background: vista === "general" ? "#1A3A5C" : "#E2E8F0", color: vista === "general" ? "#fff" : "#334155", fontWeight: 700, cursor: "pointer" }}>Stock total por artículo</button>
          <button onClick={() => setVista("detalle")} style={{ border: 0, borderRadius: 8, padding: "8px 12px", background: vista === "detalle" ? "#1A3A5C" : "#E2E8F0", color: vista === "detalle" ? "#fff" : "#334155", fontWeight: 700, cursor: "pointer" }}>Detalle por compra</button>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input style={campo} placeholder="Artículo" aria-label="Filtrar por artículo" value={busquedaArticulo} onChange={(event) => setBusquedaArticulo(event.target.value)} />
          <input style={campo} placeholder="Número de expediente" aria-label="Filtrar por expediente" value={busquedaExpediente} onChange={(event) => setBusquedaExpediente(event.target.value)} />
          <input style={campo} placeholder="Compra / orden de compra" aria-label="Filtrar por compra" value={busquedaCompra} onChange={(event) => setBusquedaCompra(event.target.value)} />
          <input style={campo} placeholder="Número de remito" aria-label="Filtrar por remito" value={busquedaRemito} onChange={(event) => setBusquedaRemito(event.target.value)} />
          <select style={campo} aria-label="Filtrar por categoría" value={categoriaFiltro} onChange={(event) => setCategoriaFiltro(event.target.value)}>
            {categoriasUnicas.map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
          </select>
          <button type="button" onClick={limpiarFiltros} style={{ border: "1px solid #CBD5E1", borderRadius: 8, padding: "8px 12px", background: "#F8FAFC", cursor: "pointer" }}>Limpiar</button>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E5E7EB", background: "#F9FAFB" }}>
              <th style={{ padding: "12px 16px", color: "#6B7280" }}>Artículo / Categoría</th>
              <th style={{ padding: "12px 16px", color: "#6B7280" }}>Expediente / Compra / Remito</th>
              <th style={{ padding: "12px 16px", color: "#6B7280", textAlign: "center" }}>Ingresos</th>
              <th style={{ padding: "12px 16px", color: "#6B7280", textAlign: "center" }}>Egresos</th>
              <th style={{ padding: "12px 16px", color: "#6B7280", textAlign: "right" }}>Stock actual</th>
              {(onAbrirFicha || onAbrirEgreso) && <th style={{ padding: "12px 16px", color: "#6B7280", textAlign: "center" }}>Acción</th>}
            </tr>
          </thead>
          <tbody>
            {stockFiltrado.map((item) => {
              const detalle = item.compras || [item];
              const referencias = new Map();
              detalle.forEach((registro) => {
                const historico = !registro.compraId;
                const clave = historico
                  ? `historico:${registro.origen || "sin-origen"}`
                  : `compra:${registro.origen || ""}:${registro.compraId}`;
                const etiqueta = registro.compraId
                  ? `Exp. ${registro.numero_expediente || "—"} · ${registro.orden_compra || registro.compraId}${registro.nroRemito ? ` · Rem. ${registro.nroRemito}` : ""}`
                  : `Histórico sin compra · ${registro.origen === "nacion" ? "Nación" : "Provincia"}`;
                const actual = referencias.get(clave);
                referencias.set(clave, {
                  etiqueta,
                  cantidad: (actual?.cantidad || 0) + 1,
                });
              });
              const abrirFicha = () => onAbrirFicha?.(item);
              return (
                <tr
                  key={item.id}
                  onClick={onAbrirFicha ? abrirFicha : undefined}
                  onKeyDown={onAbrirFicha ? (event) => {
                    if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      abrirFicha();
                    }
                  } : undefined}
                  role={onAbrirFicha ? "button" : undefined}
                  tabIndex={onAbrirFicha ? 0 : undefined}
                  style={{ borderBottom: "1px solid #F3F4F6", cursor: onAbrirFicha ? "pointer" : "default" }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, color: "#111827", textDecoration: onAbrirFicha ? "underline" : "none", textDecorationColor: "#CBD5E1" }}>{item.descripcion}</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>{item.categoria}</div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#475569" }}>
                    {vista === "detalle" ? (
                      item.compraId ? (
                        <div>
                          <div>Exp. {item.numero_expediente || "—"}</div>
                          <div>{item.origen === "nacion" ? "Nación" : "Provincia"} · Compra {item.orden_compra || item.compraId}</div>
                          {item.nroRemito && <div>Remito {item.nroRemito}</div>}
                        </div>
                      ) : <span>Histórico pendiente de identificar</span>
                    ) : (
                      <div>
                        {[...referencias.entries()].map(([clave, referencia]) => (
                          <div key={clave}>
                            {referencia.etiqueta}
                            {referencia.cantidad > 1 ? ` · ${referencia.cantidad} registros` : ""}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#059669", textAlign: "center" }}>{item.ingresos}</td>
                  <td style={{ padding: "12px 16px", color: "#B91C1C", textAlign: "center" }}>{item.egresos}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, textAlign: "right" }}>{item.stock} <span style={{ color: "#6B7280", fontWeight: 500 }}>{item.unidad}</span></td>
                  {(onAbrirFicha || onAbrirEgreso) && (
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      {onAbrirFicha && <button type="button" onClick={(event) => { event.stopPropagation(); abrirFicha(); }} style={{ marginRight: 6 }}>Ver ficha</button>}
                      {onAbrirEgreso && item.stock > 0 && <button type="button" onClick={(event) => { event.stopPropagation(); onAbrirEgreso(item); }}>Registrar salida</button>}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {stockFiltrado.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#9CA3AD" }}>No se encontraron artículos.</div>}
      </div>
    </div>
  );
}
