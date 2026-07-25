import React, { useState, useMemo } from 'react';

export default function PaginaStock({ stockConsolidado, onAbrirFicha }) {
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
              <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600, textAlign: 'center' }}>Total Ingresos</th>
              <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600, textAlign: 'center' }}>Total Egresos</th>
              <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600, textAlign: 'right' }}>Stock Total</th>
            </tr>
          </thead>
          <tbody>
            {stockFiltrado.map((item) => {
              const estado = getEstado(item.stock);
              return (
                <tr key={item.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, color: "#111827" }}>{item.descripcion}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{item.categoria}</div>
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#059669", textAlign: 'center' }}>
                    {item.ingresos}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#B91C1C", textAlign: 'center' }}>
                    {item.egresos}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 16, color: estado.color, textAlign: 'right' }}>
                    {item.stock} <span style={{ color: '#6B7280', fontWeight: 500 }}>{item.unidad}</span>
                  </td>
                  {/* La columna de estado se puede descomentar si se desea
                  <td style={{ padding: "12px 16px", textAlign: 'center' }}>
                    <span style={{
                      background: `${estado.color}20`,
                      color: estado.color,
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700
                    }}>
                      {estado.label}
                    </span>
                  </td>
                  */}
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