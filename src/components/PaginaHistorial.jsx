import React, { useState } from 'react';
import { formatFechaCorta } from '../constants';

export default function PaginaHistorial({ todosLosMovimientos, onEditar, onEliminar, onVerDetalle, usuarioActual, onCarga }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");

  const historialFiltrado = [...todosLosMovimientos]
    .sort((a, b) => new Date(b.fechaCarga || b.fecha) - new Date(a.fechaCarga || a.fecha))
    .filter(mov => {
      const busquedaLower = busqueda.toLowerCase();
      const coincideBusqueda = mov.descripcion.toLowerCase().includes(busquedaLower) ||
                               (mov.categoria && mov.categoria.toLowerCase().includes(busquedaLower)) ||
                               (mov.cargadoPor && mov.cargadoPor.toLowerCase().includes(busquedaLower)) ||
                               (mov.nroRemito && mov.nroRemito.toLowerCase().includes(busquedaLower)) ||
                               (mov.numero_expediente && mov.numero_expediente.toLowerCase().includes(busquedaLower));
      
      const coincideTipo = filtroTipo === "Todos" || mov.tipo === filtroTipo;

      return coincideBusqueda && coincideTipo;
    });

  const esAdmin = usuarioActual.rol === "Administrador";

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>Historial de Movimientos</h1>
        <button onClick={() => onCarga()} style={{ background: "#1D4ED8", color: "#fff", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          + Nuevo Movimiento
        </button>
      </div>
      
      <div style={{ padding: "12px 16px", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <input type="text" placeholder="Buscar por artículo, usuario, remito, expediente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ flex: 1, minWidth: 250, padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14 }} />
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14, background: "#fff", minWidth: 150 }}>
          <option value="Todos">Todos los Tipos</option>
          <option value="ingreso">Solo Ingresos</option>
          <option value="egreso">Solo Egresos</option>
        </select>
        {/* Aquí irían los botones de exportar y vaciar */}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: "1px solid #E5E7EB", overflow: 'hidden' }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E5E7EB", background: '#F9FAFB' }}>
              <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600 }}>Fecha</th>
              <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600 }}>Producto</th>
              <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600 }}>Tipo</th>
              <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600, textAlign: 'right' }}>Cantidad</th>
              <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600 }}>Usuario</th>
              <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600 }}>Motivo</th>
              <th style={{ padding: "12px 16px", color: "#6B7280", fontWeight: 600, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {historialFiltrado.map((mov) => (
              <tr key={mov.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td style={{ padding: "12px 16px", color: "#4B5563" }}>{formatFechaCorta(mov.fechaCarga || mov.fecha)}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontWeight: 600, color: "#111827" }}>{mov.descripcion}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{mov.categoria}</div>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    background: mov.tipo === 'ingreso' ? '#D1FAE5' : '#FEE2E2',
                    color: mov.tipo === 'ingreso' ? '#065F46' : '#991B1B',
                    padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700
                  }}>
                    {mov.tipo === 'ingreso' ? 'Entrada' : 'Salida'}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: mov.tipo === 'ingreso' ? '#059669' : '#B91C1C', textAlign: 'right' }}>
                  {mov.tipo === 'ingreso' ? '+' : '-'}{mov.cantidad} {mov.unidad}
                </td>
                <td style={{ padding: "12px 16px", color: "#4B5563" }}>{mov.cargadoPor}</td>
                <td style={{ padding: "12px 16px", color: "#4B5563" }}>
                  {mov.numero_expediente || mov.nroRemito || "Ajuste manual"}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button onClick={() => onVerDetalle(mov)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#4B5563' }}>🔎</button>
                    {esAdmin && (
                      <>
                        <button onClick={() => onEditar(mov)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#3B82F6' }}>✏️</button>
                        <button onClick={() => onEliminar(mov)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444' }}>🗑️</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {historialFiltrado.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "#9CA3AD" }}>No se encontraron movimientos.</div>
        )}
      </div>
    </div>
  );
}