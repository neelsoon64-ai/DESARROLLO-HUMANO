import { useState } from "react";
import { utils, writeFile } from "xlsx";
import { AlertTriangle, Clock } from 'lucide-react';

export default function Seccion({ nombre, color, colorClaro, datos, onCarga, onEditar, onVerDetalle, usuarioActual, onAudit }) {
  const [busqueda, setBusqueda] = useState(""); // 'stock' o 'historial'
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [pestaña, setPestaña] = useState("stock"); // 'stock' o 'historial'

  // 🛡️ ADAPTADOR CRÍTICO: Convierte objetos de Realtime DB a Array plano
  const movimientos = (() => {
    // Si no hay datos o no hay 'movimientos', devuelve un array vacío.
    if (!datos || typeof datos.movimientos !== 'object' || datos.movimientos === null) return [];
    // Si 'movimientos' ya es un array, lo usamos directamente (filtrando nulos).
    if (Array.isArray(datos.movimientos)) return datos.movimientos.filter(Boolean);
    // Si 'movimientos' es un objeto (como lo envía Firebase), lo convertimos a un array.
    // Esta es la conversión clave que soluciona el problema.
    return Object.values(datos.movimientos).filter(Boolean);
    return [];
  })();

  const esAdmin = usuarioActual?.rol === "Administrador";

  // =================================================================================
  // ✨ LÓGICA DE STOCK SIMPLIFICADA: TOTAL INGRESOS - TOTAL EGRESOS ✨
  // =================================================================================
  const calcularStock = () => {
    const stockConsolidado = {};

    // 1. Recorrer todos los movimientos para consolidar el stock por artículo.
    movimientos.forEach((mov) => {
      if (!mov.descripcion) return; // Ignorar movimientos sin descripción

      const key = mov.descripcion.toLowerCase();
      const cantidad = isNaN(Number(mov.cantidad)) ? 0 : Number(mov.cantidad);

      // Si el artículo no existe en el consolidado, lo inicializamos.
      if (!stockConsolidado[key]) {
        stockConsolidado[key] = { ...mov, stock: 0 };
      }

      // 2. Sumar si es ingreso/inicial, restar si es egreso.
      if (mov.tipo === 'ingreso' || mov.tipo === 'inicial') {
        stockConsolidado[key].stock += cantidad;
      } else if (mov.tipo === 'egreso') {
        stockConsolidado[key].stock -= cantidad;
      }
    });

    return Object.values(stockConsolidado).sort((a, b) => a.descripcion.localeCompare(b.descripcion));
  };

  const listaStock = calcularStock();
  const totalItemsUnicos = new Set(movimientos.map(m => m.descripcion)).size;

  // ✨ CÁLCULO DEL TOTAL DE UNIDADES EN STOCK
  const totalUnidadesEnStock = listaStock.reduce((total, item) => total + item.stock, 0);
  // =================================================================================


  const categoriasUnicas = ["Todas", ...new Set(movimientos.map((m) => m.categoria || "General"))];

  // Filtrados
  const stockFiltrado = listaStock.filter((item) => {
    const coincideBusqueda = item.descripcion.toLowerCase().includes(busqueda.toLowerCase()) || item.categoria.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaFiltro === "Todas" || item.categoria === categoriaFiltro;
    return coincideBusqueda && coincideCategoria;
  });

  const historialFiltrado = [...movimientos]
    .sort((a, b) => new Date(b.fechaCarga) - new Date(a.fechaCarga))
    .filter(mov => {
      const coincideBusqueda = mov.descripcion.toLowerCase().includes(busqueda.toLowerCase()) || (mov.nroRemito && mov.nroRemito.toLowerCase().includes(busqueda.toLowerCase()));
      const coincideCategoria = categoriaFiltro === "Todas" || mov.categoria === categoriaFiltro;
      return coincideBusqueda && coincideCategoria;
    });

  const exportarExcel = () => {
    const dataExport = pestaña === "stock" 
      ? stockFiltrado.map(i => ({ Categoría: i.categoria, Descripción: i.descripcion, 'Stock Remanente': i.stock, Unidad: i.unidad, 'Remito Origen': i.nroRemito, 'Fecha Carga': new Date(i.fechaCarga).toLocaleDateString(), 'Fecha Vto': i.fechaVencimiento ? new Date(i.fechaVencimiento).toLocaleDateString() : 'N/A' }))
      : historialFiltrado.map(h => ({ Fecha: new Date(h.fechaCarga).toLocaleDateString(), Remito: h.nroRemito, Categoría: h.categoria, Descripción: h.descripcion, Cantidad: h.cantidad, Unidad: h.unidad, Operario: h.cargadoPor }));

    const wb = utils.book_new();
    const ws = utils.json_to_sheet(dataExport);
    utils.book_append_sheet(wb, ws, pestaña === "stock" ? "Stock Actual" : "Historial");
    writeFile(wb, `${nombre}-${pestaña}.xlsx`);
    if (onAudit) onAudit({ tipo: "exportar", detalle: `Exportó Excel de ${nombre} (${pestaña})` });
  };

  const exportarPDF = () => {
    window.print();
    if (onAudit) onAudit({ tipo: "exportar", detalle: `Exportó PDF/Impresión de ${nombre} (${pestaña})` });
  };

  const VencimientoTag = ({ fechaVencimiento }) => {
    if (!fechaVencimiento) return <span style={{ color: '#94A3B8', fontSize: 11 }}>N/A</span>;
    const hoy = new Date();
    const fechaVto = new Date(fechaVencimiento);
    const diffDias = Math.ceil((fechaVto - hoy) / (1000 * 60 * 60 * 24));
    const color = diffDias < 0 ? '#DC2626' : diffDias <= 30 ? '#F59E0B' : '#64748B';
    const Icono = diffDias < 0 ? AlertTriangle : diffDias <= 30 ? Clock : null;
    return <span style={{ color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>{Icono && <Icono size={13} />} {fechaVto.toLocaleDateString()}</span>;
  };

  return (
    <div className="seccion-contenedor" style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", overflow: "hidden", border: "1px solid #E2E8F0", marginBottom: "20px" }}>
      
      {/* Inyección de estilos CSS dinámicos para corregir la exportación del PDF */}
      <style>{`
        @media print {
          body * { visibility: hidden; background: transparent !important; box-shadow: none !important; }
          .seccion-contenedor, .seccion-contenedor * { visibility: visible; }
          .seccion-contenedor { position: absolute; left: 0; top: 0; width: 100%; border: none !important; }
          .no-print-barra, .no-print-btn, .no-print-filtros { display: none !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border-bottom: 1px solid #94A3B8 !important; padding: 8px !important; }
        }
      `}</style>

      {/* Encabezado Control */}
      <div className="no-print-barra" style={{ background: `linear-gradient(135deg, ${color}, ${colorClaro})`, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ color: "#fff", margin: 0, fontSize: 16, fontWeight: 800 }}>{nombre}</h2>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>
            {totalUnidadesEnStock} unidades en stock · {totalItemsUnicos} ítems únicos
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onCarga} disabled={!onCarga} style={{ background: "#F59E0B", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: onCarga ? "pointer" : "not-allowed", boxShadow: "0 2px 6px rgba(0,0,0,0.15)", opacity: onCarga ? 1 : 0.55 }}>+ Nueva Carga</button>
          <button onClick={exportarExcel} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, padding: "7px 10px", fontSize: 11, cursor: "pointer" }}>📊 Excel</button>
          <button onClick={exportarPDF} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, padding: "7px 10px", fontSize: 11, cursor: "pointer" }}>📄 Exportar PDF</button>
        </div>
      </div>

      {/* Título invisible para el PDF Impreso */}
      <div className="print-only" style={{ display: "none" }}>
        <h2 style={{ fontSize: "20px", color: "#1E293B", marginBottom: "10px" }}>{nombre} - Reporte Oficial</h2>
      </div>

      {/* Selectores de Pestaña */}
      <div className="no-print-barra" style={{ display: "flex", borderBottom: "1px solid #E2E8F0" }}>
        <button onClick={() => setPestaña("stock")} style={{ flex: 1, padding: "12px", background: "none", border: "none", borderBottom: pestaña === "stock" ? `3px solid ${color}` : "3px solid transparent", color: pestaña === "stock" ? color : "#64748B", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>📦 Stock Consolidado</button>
        <button onClick={() => setPestaña("historial")} style={{ flex: 1, padding: "12px", background: "none", border: "none", borderBottom: pestaña === "historial" ? `3px solid ${color}` : "3px solid transparent", color: pestaña === "historial" ? color : "#64748B", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>📜 Historial de Movimientos</button>
      </div>

      {/* Barra de Filtros */}
      <div className="no-print-filtros" style={{ padding: "12px 16px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input type="text" placeholder="Buscar por descripción..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ flex: 1, minWidth: 180, padding: "7px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 12 }} />
        <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 12, background: "#fff" }}>
          {categoriasUnicas.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {/* Contenedor de Tablas */}
      <div style={{ overflowX: "auto", padding: "8px" }}>
        {pestaña === "stock" ? (
          stockFiltrado.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No hay artículos en stock.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E2E8F0", color: "#64748B" }}>
                  <th style={{ padding: "10px" }}>Artículo</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Stock Remanente</th>
                </tr>
              </thead>
              <tbody>
                {stockFiltrado.map((item, idx) => (
                  <tr key={item.descripcion + idx} style={{ borderBottom: "1px solid #F1F5F9", background: item.stock <= 0 ? '#FEF2F2' : 'transparent' }}>
                    <td style={{ padding: "10px" }}>
                      <div style={{ fontWeight: 600, color: "#1E293B" }}>{item.descripcion}</div>
                      <span style={{ background: "#E2E8F0", padding: "2px 6px", borderRadius: 6, fontSize: 10, fontWeight: 600, color: '#475569' }}>{item.categoria}</span>
                    </td>
                    <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, fontSize: 14, color: item.stock > 0 ? "#16A34A" : "#DC2626" }}>
                      {item.stock} <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{item.unidad}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          historialFiltrado.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No hay movimientos registrados.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E2E8F0", color: "#64748B" }}>
                  <th style={{ padding: "10px" }}>Fecha</th>
                  <th style={{ padding: "10px" }}>Tipo</th>
                  <th style={{ padding: "10px" }}>Artículo</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Cantidad</th>
                  <th style={{ padding: "10px" }}>Operario</th>
                  <th style={{ padding: "10px" }}>Remito</th>
                  <th className="no-print-btn" style={{ padding: "10px", textAlign: "center" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {historialFiltrado.map((mov, idx) => (
                  <tr key={mov.id || idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px", color: "#64748B", fontSize: 11 }}>{new Date(mov.fechaCarga).toLocaleDateString()}</td>
                    <td style={{ padding: "10px", fontWeight: 700, color: mov.tipo === 'ingreso' ? '#16A34A' : '#DC2626' }}>{mov.tipo === 'ingreso' ? '📥 Ingreso' : '📤 Egreso'}</td>
                    <td style={{ padding: "10px" }}>
                      <div style={{ fontWeight: 600, color: "#1E293B" }}>{mov.descripcion}</div>
                      <span style={{ fontSize: 10, color: "#64748B" }}>{mov.categoria}</span>
                    </td>
                    <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: mov.tipo === 'ingreso' ? '#16A34A' : '#DC2626' }}>{mov.tipo === 'ingreso' ? '+' : '-'}{mov.cantidad} {mov.unidad}</td>
                    <td style={{ padding: "10px", color: "#64748B", fontSize: 11 }}>👤 {mov.cargadoPor || "Sistema"}</td>
                    <td style={{ padding: "10px", color: "#475569", fontSize: 11 }}>{mov.nroRemito || "s/n"}</td>
                    <td className="no-print-btn" style={{ padding: "10px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        {onEditar && (
                          <button 
                            onClick={() => onEditar(mov)} 
                            style={{ padding: "4px 8px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 6, color: "#2563EB", cursor: "pointer", fontWeight: 600, fontSize: 11 }}
                          >
                            ✏️ Editar
                          </button>
                        )}
                        {typeof onEliminar === "function" && (
                          <button
                            onClick={() => {
                              if (confirm(`¿Confirmás eliminar "${mov.descripcion}"?`)) {
                                onEliminar(mov);
                                if (onAudit) onAudit({ tipo: "eliminacion", detalle: `Eliminó ${mov.descripcion}` });
                              }
                            }}
                            style={{ padding: "4px 8px", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 6, color: "#B91C1C", cursor: "pointer", fontWeight: 700, fontSize: 11 }}
                          >
                            🗑️ Eliminar
                          </button>
                        )}
                        <button
                          onClick={() => onVerDetalle && onVerDetalle(mov)}
                          style={{ padding: "4px 8px", background: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: 6, color: "#0F172A", cursor: "pointer", fontWeight: 600, fontSize: 11 }}
                        >
                          🔎 Ver
                        </button>
                      </div>
                    </td>
                  </tr>
               ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}