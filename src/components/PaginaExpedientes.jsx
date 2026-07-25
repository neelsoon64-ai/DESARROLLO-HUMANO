import React, { useState, useMemo } from 'react';
import { formatFechaCorta } from '../constants';

export default function PaginaExpedientes({ todosLosMovimientos }) {
  const [busqueda, setBusqueda] = useState("");

  const expedientesAgrupados = useMemo(() => {
    const expedientes = {};
    todosLosMovimientos.forEach(mov => {
      if (mov.tipo === 'egreso' && mov.numero_expediente) {
        const expId = mov.numero_expediente;
        if (!expedientes[expId]) {
          expedientes[expId] = {
            id: expId,
            destinatario: mov.destinatario,
            institucion: mov.institucion, // Asumiendo que este campo existe
            fecha: mov.fechaCarga || mov.fecha,
            usuario: mov.cargadoPor,
            remito: mov.nroRemito,
            observaciones: mov.observaciones,
            fotos: Array.isArray(mov.foto) ? mov.foto : (mov.foto ? [mov.foto] : []),
            articulos: []
          };
        }
        expedientes[expId].articulos.push({
          id: mov.id,
          descripcion: mov.descripcion,
          cantidad: mov.cantidad,
          unidad: mov.unidad
        });
      }
    });
    return Object.values(expedientes).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [todosLosMovimientos]);

  const expedientesFiltrados = expedientesAgrupados.filter(exp => 
    exp.id.toLowerCase().includes(busqueda.toLowerCase()) ||
    (exp.destinatario && exp.destinatario.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 16 }}>Consulta por Expediente</h1>
      
      <div style={{ padding: "12px 16px", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <input type="text" placeholder="Buscar por N° de expediente o destinatario..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ flex: 1, minWidth: 300, padding: "8px 12px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 14 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {expedientesFiltrados.map(exp => (
          <div key={exp.id} style={{ background: '#fff', borderRadius: 12, border: "1px solid #E5E7EB", overflow: 'hidden' }}>
            <div style={{ padding: '16px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Expediente: {exp.id}</h2>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#4B5563' }}>Destinatario: <strong>{exp.destinatario || 'No especificado'}</strong></p>
              </div>
              <div style={{textAlign: 'right'}}>
                <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>Fecha: {formatFechaCorta(exp.fecha)}</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B7280' }}>Usuario: {exp.usuario}</p>
              </div>
            </div>
            <div style={{ padding: '16px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 13, fontWeight: 600, color: '#374151' }}>Artículos Entregados:</h4>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {exp.articulos.map(art => (
                  <li key={art.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#F9FAFB', borderRadius: 8 }}>
                    <span style={{ color: '#111827', fontWeight: 500 }}>{art.descripcion}</span>
                    <span style={{ color: '#111827', fontWeight: 700 }}>{art.cantidad} {art.unidad}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
        {expedientesFiltrados.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "#9CA3AD", background: '#fff', borderRadius: 12, border: "1px solid #E5E7EB" }}>
            No se encontraron expedientes con ese criterio de búsqueda.
          </div>
        )}
      </div>
    </div>
  );
}