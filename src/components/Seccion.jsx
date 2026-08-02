import { useState, useMemo } from "react";
import { utils, writeFile } from "xlsx";
import { AlertTriangle, Clock, MinusCircle } from 'lucide-react';

export default function Seccion({ nombre, color, colorClaro, datos, onCarga, onEditar, onVerDetalle, usuarioActual, onAudit, onRegistrarSalida }) {
  const [busqueda, setBusqueda] = useState(""); // 'stock' o 'historial'
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [pestaña, setPestaña] = useState("stock"); // 'stock' o 'historial'

  // 🛡️ ADAPTADOR CRÍTICO: Convierte objetos de Realtime DB a Array plano
  const movimientos = (() => {
    // Si no hay datos o no hay 'movimientos', devuelve un array vacío.
    if (!datos || typeof datos.movimientos !== 'object' || datos.movimientos === null) return [];
    
    // Si 'movimientos' ya es un array, lo usamos directamente (filtrando nulos).
    if (Array.isArray(datos.movimientos)) {
      const resultado = datos.movimientos.filter(Boolean);
      console.debug("Seccion: Usando array directo. Total movimientos:", resultado.length);
      return resultado;
    }
    
    // Si 'movimientos' es un objeto (compatibilidad backwards), lo convertimos a array.
    const resultado = Object.values(datos.movimientos).filter(Boolean);
    console.debug("Seccion: Convertida estructura de objeto a array. Total movimientos:", resultado.length);
    return resultado;
  })();

  const esAdmin = usuarioActual?.rol === "Administrador";

  // ✅ CORRECCIÓN: Declarar expedientesUnicos usando useMemo para optimización.
  // Esto crea una lista única de todos los números de expediente existentes.
  const expedientesUnicos = useMemo(() => {
    if (!movimientos || movimientos.length === 0) return [];
    const expedientesSet = new Set(movimientos.map(m => m.numero_expediente).filter(Boolean));
    return [...expedientesSet];
  }, [movimientos]);

  // =================================================================================
  // ✨ LÓGICA DE STOCK SIMPLIFICADA: TOTAL INGRESOS - TOTAL EGRESOS ✨
  // =================================================================================
  const stockConsolidado = useMemo(() => {
    if (!movimientos || !Array.isArray(movimientos)) return [];

    const acumulado = movimientos.reduce((acc, mov) => {
      if (!mov.descripcion) return acc; // Ignorar movimientos sin descripción

      // ✅ REFACTORIZACIÓN CLAVE: La única clave de agrupación es `categoría + descripción`.
      // Se eliminó por completo la agrupación por `remito` o `expediente`.
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

      // ✅ CÁLCULO AUTOMÁTICO: Suma o resta según el tipo de movimiento.
      const cantidad = isNaN(Number(mov.cantidad)) ? 0 : Number(mov.cantidad);
      if (mov.tipo === 'ingreso' || mov.tipo === 'inicial') {
        acc[key].ingresos += cantidad;
      } else if (mov.tipo === 'egreso') {
        acc[key].egresos += cantidad;
      }
      return acc;
    }, {});

    // ✅ CÁLCULO FINAL: Se calcula el stock final después de procesar todos los movimientos.
    Object.values(acumulado).forEach(item => { item.stock = item.ingresos - item.egresos; });
    return Object.values(acumulado).sort((a, b) => a.descripcion.localeCompare(b.descripcion) || a.categoria.localeCompare(b.categoria));
  }, [movimientos]);

  const totalItemsUnicos = new Set(movimientos.map(m => m.descripcion)).size;

  // ✨ CÁLCULO DEL TOTAL DE UNIDADES EN STOCK
  const totalUnidadesEnStock = stockConsolidado.reduce((total, item) => total + item.stock, 0);
  // =================================================================================


  const categoriasUnicas = ["Todas", ...new Set(movimientos.map((m) => m.categoria || "General"))];

  // Filtrados
  const stockFiltrado = stockConsolidado.filter((item) => {
    const coincideBusqueda = item.descripcion.toLowerCase().includes(busqueda.toLowerCase()) || item.categoria.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaFiltro === "Todas" || item.categoria === categoriaFiltro;
    return coincideBusqueda && coincideCategoria;
  });

  const historialFiltrado = [...movimientos]
    .sort((a, b) => new Date(b.fechaCarga) - new Date(a.fechaCarga))
    .filter(mov => {
      // ✅ Si busqueda está vacía, mostrar TODO sin filtro de búsqueda
      if (!busqueda.trim()) {
        const coincideCategoria = categoriaFiltro === "Todas" || mov.categoria === categoriaFiltro;
        return coincideCategoria;
      }
      
      // Si hay búsqueda, aplicar filtro inteligente
      const busquedaLower = busqueda.toLowerCase();
      const coincideBusqueda = mov.descripcion.toLowerCase().includes(busquedaLower) ||
                               (mov.categoria && mov.categoria.toLowerCase().includes(busquedaLower)) ||
                               (mov.cargadoPor && mov.cargadoPor.toLowerCase().includes(busquedaLower)) ||
                               (mov.nroRemito && mov.nroRemito.toLowerCase().includes(busquedaLower)) ||
                               (mov.numero_expediente && mov.numero_expediente.toLowerCase().includes(busquedaLower));
      const coincideCategoria = categoriaFiltro === "Todas" || mov.categoria === categoriaFiltro;
      return coincideBusqueda && coincideCategoria;
    });

  const exportarExcel = () => {
    const dataExport = pestaña === "stock" 
      ? stockFiltrado.map(i => ({ Categoría: i.categoria, Descripción: i.descripcion, 'Stock Remanente': i.stock, Unidad: i.unidad, 'Remito Origen': i.nroRemito, 'Fecha Carga': new Date(i.fechaCarga).toLocaleDateString(), 'Fecha Vto': i.fechaVencimiento ? new Date(i.fechaVencimiento).toLocaleDateString() : 'N/A' }))
      : historialFiltrado.map(h => ({ Fecha: new Date(h.fechaCarga).toLocaleDateString(), Remito: h.nroRemito, 'Orden Compra': h.orden_compra || '', Expediente: h.numero_expediente || '', Categoría: h.categoria, Descripción: h.descripcion, Cantidad: h.cantidad, Unidad: h.unidad, Operario: h.cargadoPor }));

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
          <button onClick={() => onCarga({ expedientesExistentes: expedientesUnicos, stockDisponible: stockConsolidado })} disabled={!onCarga} style={{ background: "#F59E0B", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: onCarga ? "pointer" : "not-allowed", boxShadow: "0 2px 6px rgba(0,0,0,0.15)", opacity: onCarga ? 1 : 0.55 }}>+ Nueva Carga</button>
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
        <button onClick={() => setPestaña("stock")} style={{ flex: 1, padding: "12px", background: "none", border: "none", borderBottom: pestaña === "stock" ? `3px solid ${color}` : "3px solid transparent", color: pestaña === "stock" ? color : "#64748B", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>📦 Stock Actual</button>
        <button onClick={() => setPestaña("historial")} style={{ flex: 1, padding: "12px", background: "none", border: "none", borderBottom: pestaña === "historial" ? `3px solid ${color}` : "3px solid transparent", color: pestaña === "historial" ? color : "#64748B", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>📜 Ver Historial</button>
      </div>

      {/* Barra de Filtros */}
      <div className="no-print-filtros" style={{ padding: "12px 16px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input type="text" placeholder="Buscar por descripción..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ flex: 1, minWidth: 180, padding: "7px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 12 }} />
        <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 12, background: "#fff", minWidth: 150 }}>
          {categoriasUnicas.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        {(busqueda || categoriaFiltro !== "Todas") && (
          <button 
            onClick={() => { setBusqueda(""); setCategoriaFiltro("Todas"); }} 
            style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #E11D48", background: "#FEE2E2", color: "#B91C1C", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
          >
            ✕ Limpiar filtros
          </button>
        )}
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
                  <th style={{ padding: "10px" }}>Artículo / Categoría</th>
                  <th style={{ padding: "10px", textAlign: "center" }}>Ingresos</th>
                  <th style={{ padding: "10px", textAlign: "center" }}>Egresos</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Stock Actual</th>
                  <th className="no-print-btn" style={{ padding: "10px", textAlign: "center" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {stockFiltrado.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9", background: item.stock <= 0 ? '#FEF2F2' : 'transparent' }}>
                    <td style={{ padding: "10px" }}>
                      <div style={{ fontWeight: 700, color: "#1E293B", fontSize: 13 }}>{item.descripcion}</div>
                      <span style={{ background: "#E2E8F0", padding: "2px 6px", borderRadius: 6, fontSize: 10, fontWeight: 600, color: '#475569' }}>{item.categoria}</span>
                    </td>
                    <td style={{ padding: "10px", textAlign: "center", fontWeight: 600, color: "#16A34A" }}>
                      {item.ingresos}
                    </td>
                    <td style={{ padding: "10px", textAlign: "center", fontWeight: 600, color: "#DC2626" }}>
                      {item.egresos}
                    </td>
                    <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, fontSize: 14, color: item.stock > 0 ? "#16A34A" : "#DC2626" }}>
                      {item.stock} <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{item.unidad}</span>
                    </td>
                    <td className="no-print-btn" style={{ padding: "10px", textAlign: "center" }}>
                      {onRegistrarSalida && item.stock > 0 && (
                        <button 
                          onClick={() => onRegistrarSalida(item)}
                          style={{
                            background: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA", borderRadius: 6, 
                            padding: "5px 10px", cursor: "pointer", fontWeight: 600, fontSize: 11,
                            display: 'flex', alignItems: 'center', gap: 4, margin: 'auto'
                          }}
                        >
                          <MinusCircle size={14} /> Registrar Salida
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          historialFiltrado.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
              {movimientos.length === 0 ? (
                <div>No hay movimientos registrados.</div>
              ) : (
                <div>
                  <div>No hay movimientos que coincidan con los filtros.</div>
                  <div style={{ marginTop: 12, fontSize: 11, color: "#64748B" }}>
                    Total en el sistema: {movimientos.length} movimientos
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{ padding: "12px 16px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", fontSize: 12, color: "#64748B", fontWeight: 600 }}>
                📊 Mostrando {historialFiltrado.length} de {movimientos.length} movimientos
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E2E8F0", color: "#64748B" }}>
                  <th style={{ padding: "10px" }}>Fecha</th>
                  <th style={{ padding: "10px" }}>Tipo</th>
                  <th style={{ padding: "10px" }}>Artículo</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Cantidad</th>
                  <th style={{ padding: "10px" }}>Operario</th>
                  <th style={{ padding: "10px" }}>Remito / Expediente</th>
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
                      {mov.tipo === 'egreso' && (mov.nombre_destinatario || mov.apellido_destinatario || mov.destinatario) && (
                        <div style={{ marginTop: 4, paddingTop: 6, borderTop: "1px solid #E5E7EB", fontSize: 11 }}>
                          <div style={{ fontWeight: 600, color: "#1F2937" }}>
                            👤 {[mov.nombre_destinatario, mov.apellido_destinatario].filter(Boolean).join(' ') || mov.destinatario}
                          </div>
                          {mov.dni_destinatario && (
                            <div style={{ fontSize: 10, color: "#6B7280" }}>DNI: {mov.dni_destinatario}</div>
                          )}
                          {mov.destinatario && !mov.nombre_destinatario && (
                            <div style={{ fontSize: 10, color: "#6B7280" }}>{mov.destinatario}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: mov.tipo === 'ingreso' ? '#16A34A' : '#DC2626' }}>{mov.tipo === 'ingreso' ? '+' : '-'}{mov.cantidad} {mov.unidad}</td>
                    <td style={{ padding: "10px", color: "#64748B", fontSize: 11 }}>👤 {mov.cargadoPor || "Sistema"}</td>
                    <td style={{ padding: "10px", color: "#475569", fontSize: 11 }}>
                      <div>{mov.nroRemito || "s/n"}</div>
                      {/* ✅ ORDEN DE COMPRA */}
                      {mov.orden_compra && (
                        <div style={{ marginTop: 2 }}><span style={{ background: "#F3F4F6", color: "#374151", padding: "2px 6px", borderRadius: 6, fontSize: 9, fontWeight: 600, border: "1px solid #D1D5DB" }}>
                          OC: {mov.orden_compra}</span></div>
                      )}
                      {/* ✅ BADGE DE EXPEDIENTE */}
                      {mov.numero_expediente && (
                        <div style={{ marginTop: 4 }}><span style={{ background: "#F1F5F9", color: "#475569", padding: "2px 6px", borderRadius: 6, fontSize: 10, fontWeight: 600, border: "1px solid #E2E8F0" }}>
                          Exp: {mov.numero_expediente}</span></div>
                      )}
                    </td>
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
            </div>
          )
        )}
      </div>
    </div>
  );
}