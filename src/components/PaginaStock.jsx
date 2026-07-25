import React, { useState, useMemo } from 'react';
import { StockBadge } from './Common';

export default function PaginaStock({ todosLosMovimientos, onVerDetalle }) {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");

  const stockConsolidado = useMemo(() => {
    if (!todosLosMovimientos || !Array.isArray(todosLosMovimientos)) return [];

    const acumulado = todosLosMovimientos.reduce((acc, mov) => {
      if (!mov.descripcion) return acc;
      const categoria = mov.categoria || "General";
      const key = `${categoria.toLowerCase()}-${mov.descripcion.toLowerCase()}`;

      if (!acc[key]) {
        acc[key] = {
          id: key,
          descripcion: mov.descripcion,
          categoria: categoria,
          unidad: mov.unidad || "unidades",
          ingresos: 0,
          egresos: 0,
          stock: 0,
        };
      }

      const cantidad = isNaN(Number(mov.cantidad)) ? 0 : Number(mov.cantidad);
      if (mov.tipo === 'ingreso' || mov.tipo === 'inicial') {
        acc[key].ingresos += cantidad;
      } else if (mov.tipo === 'egreso') {
        acc[key].egresos += cantidad;
      }
      return acc;
    }, {});

    Object.values(acumulado).forEach(item => { item.stock = item.ingresos - item.egresos; });
    return Object.values(acumulado).sort((a, b) => a.descripcion.localeCompare(b.descripcion));
  }, [todosLosMovimientos]);

  const categoriasUnicas = ["Todas", ...new Set(todosLosMovimientos.map((m) => m.categoria || "General"))];

  const stockFiltrado = stockConsolidado.filter((item) => {
    const coincideBusqueda = item.descripcion.toLowerCase().includes(busqueda.toLowerCase()) || item.categoria.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaFiltro === "Todas" || item.categoria === categoriaFiltro;
    return coincideBusqueda && coincideCategoria;
  });

  const getEstado = (stock) => {
    if (stock <= 0) return { label: 'Sin Stock', color: '#EF4444' };
    if (stock <= 10) return { label: 'Stock Bajo', color: '#F59E0B' };
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
              <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600 }}>Categoría</th>
              <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600, textAlign: 'center' }}>Stock Actual</th>
              <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600, textAlign: 'center' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {stockFiltrado.map((item) => {
              const estado = getEstado(item.stock);
              return (
                <tr key={item.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#111827" }}>
                    {item.descripcion}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#4B5563" }}>
                    {item.categoria}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#111827", textAlign: 'center' }}>
                    {item.stock} <span style={{ color: '#6B7280', fontWeight: 500 }}>{item.unidad}</span>
                  </td>
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