import React, { useState, useMemo } from 'react';

export default function PaginaStock({ stockConsolidado, onAbrirFicha, onAbrirEgreso }) {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");

  const categoriasUnicas = ["Todas", ...new Set(stockConsolidado.map((m) => m.categoria || "General"))];

  const stockFiltrado = stockConsolidado.filter((item) => {
    const coincideBusqueda = item.descripcion.toLowerCase().includes(busqueda.toLowerCase()) || item.categoria.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaFiltro === "Todas" || item.categoria === categoriaFiltro;
    return coincideBusqueda && coincideCategoria;
  });

  const getEstado = (stock, stockMinimo) => {
    if (stock <= 0) return { label: 'Sin Stock', color: '#EF4444', bg: '#FEE2E2' };
    if (stock <= stockMinimo) return { label: 'Stock Bajo', color: '#D97706', bg: '#FEF3C7' };
    return { label: 'Disponible', color: '#10B981' };
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 16 }}>Inventario Total</h1>
      
      <div style={{ padding: "12px 16px", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <input type="text" placeholder="Buscar por artículo o categoría..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14 }} />
        <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, background: "#fff", minWidth: 180 }}>
          {categoriasUnicas.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: "1px solid #E5E7EB", overflow: 'hidden' }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E5E7EB", background: '#F9FAFB' }}>
              <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600 }}>Artículo</th>
              <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600, textAlign: 'center' }}>Ingresos</th>
              <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600, textAlign: 'center' }}>Egresos</th>
              <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600, textAlign: 'right' }}>Stock Actual</th>
              <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600, textAlign: 'center' }}>Estado</th>
              <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {stockFiltrado.map((item) => {
              const estado = getEstado(item.stock, item.stockMinimo);
              return (
                <tr key={item.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, color: "#111827" }}>{item.descripcion}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{item.categoria}</div>
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 500, color: "#059669", textAlign: 'center' }}>
                    {item.ingresos}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 500, color: "#B91C1C", textAlign: 'center' }}>
                    {item.egresos}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 16, color: "#111827", textAlign: 'right' }}>
                    {item.stock} <span style={{ color: '#6B7280', fontWeight: 500 }}>{item.unidad}</span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: 'center' }}>
                    <span style={{
                      background: estado.bg,
                      color: estado.color,
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700
                    }}>
                      {estado.label}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: 'center', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                    <button onClick={() => onAbrirFicha(item)} style={{ background: '#F3F4F6', color: '#4B5563', border: '1px solid #E5E7EB', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Ver Ficha
                    </button>
                    <button onClick={() => onAbrirEgreso(item)} disabled={item.stock <= 0} style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FCA5A5', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: item.stock <= 0 ? 0.5 : 1 }}>
                      - Egreso
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {stockFiltrado.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "#9CA3AD" }}>No se encontraron artículos.</div>
        )}
      </div>
    </div>
  );
}