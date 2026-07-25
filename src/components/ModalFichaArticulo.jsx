import React from 'react';
import { overlay, modal } from '../styles';
import { formatFechaCorta } from '../constants';

export default function ModalFichaArticulo({ articulo, historial, onClose, onCarga }) {
  if (!articulo) return null;

  return (
    <div style={overlay}>
      <div style={{ ...modal, maxWidth: 700, maxHeight: '85vh' }}>
        <div style={{ background: "linear-gradient(135deg,#1E3A8A,#3B82F6)", borderRadius: "14px 14px 0 0", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{articulo.categoria}</div>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 800, marginTop: 2 }}>{articulo.descripcion}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 8, width: 34, height: 34, cursor: "pointer", fontSize: 18 }}>×</button>
        </div>

        <div style={{ padding: "22px", display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
            <div style={{textAlign: 'center'}}>
                <div style={{fontSize: 12, color: '#6B7280', fontWeight: 600}}>Total Ingresos</div>
                <div style={{fontSize: 22, fontWeight: 800, color: '#059669', marginTop: 4}}>{articulo.ingresos}</div>
            </div>
            <div style={{textAlign: 'center'}}>
                <div style={{fontSize: 12, color: '#6B7280', fontWeight: 600}}>Total Egresos</div>
                <div style={{fontSize: 22, fontWeight: 800, color: '#B91C1C', marginTop: 4}}>{articulo.egresos}</div>
            </div>
            <div style={{textAlign: 'center', background: '#fff', padding: '10px', borderRadius: 12, border: '1px solid #E5E7EB'}}>
                <div style={{fontSize: 12, color: '#6B7280', fontWeight: 600}}>Stock Actual</div>
                <div style={{fontSize: 22, fontWeight: 800, color: '#111827', marginTop: 4}}>{articulo.stock} <span style={{fontSize: 16}}>{articulo.unidad}</span></div>
            </div>
        </div>

        {/* ✅ BOTONES DE ACCIÓN PRINCIPALES */}
        <div style={{ padding: '16px 22px', display: 'flex', gap: 12, borderBottom: '1px solid #E5E7EB' }}>
            <button 
                onClick={() => onCarga({ datos: { descripcion: articulo.descripcion, categoria: articulo.categoria, tipo: 'ingreso' } })}
                style={{ flex: 1, background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                + Registrar Ingreso
            </button>
            <button 
                onClick={() => onCarga({ datos: { descripcion: articulo.descripcion, categoria: articulo.categoria, tipo: 'egreso' } })}
                style={{ flex: 1, background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                - Registrar Egreso
            </button>
        </div>

        <div style={{ padding: "0 22px 22px", overflowY: "auto", flex: 1 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginTop: 20, marginBottom: 12 }}>Historial de Movimientos del Artículo</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                <th style={{ padding: "8px", color: "#6B7280", fontWeight: 600 }}>Fecha</th>
                <th style={{ padding: "8px", color: "#6B7280", fontWeight: 600 }}>Tipo</th>
                <th style={{ padding: "8px", color: "#6B7280", fontWeight: 600, textAlign: 'right' }}>Cantidad</th>
                <th style={{ padding: "8px", color: "#6B7280", fontWeight: 600 }}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {historial.sort((a, b) => new Date(b.fechaCarga || b.fecha) - new Date(a.fechaCarga || a.fecha)).map(mov => (
                <tr key={mov.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "10px 8px" }}>{formatFechaCorta(mov.fechaCarga || mov.fecha)}</td>
                  <td style={{ padding: "10px 8px" }}>
                    <span style={{
                      background: mov.tipo === 'ingreso' ? '#D1FAE5' : '#FEE2E2',
                      color: mov.tipo === 'ingreso' ? '#065F46' : '#991B1B',
                      padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700
                    }}>
                      {mov.tipo === 'ingreso' ? 'Entrada' : 'Salida'}
                    </span>
                  </td>
                  <td style={{ padding: "10px 8px", fontWeight: 700, color: mov.tipo === 'ingreso' ? '#059669' : '#B91C1C', textAlign: 'right' }}>
                    {mov.tipo === 'ingreso' ? '+' : '-'}{mov.cantidad} {mov.unidad}
                  </td>
                  <td style={{ padding: "10px 8px", color: '#4B5563' }}>
                    {mov.tipo === 'egreso' ? (
                      <span>Exp: {mov.numero_expediente || 'N/A'} - {mov.destinatario}</span>
                    ) : (
                      <span>Prov: {mov.proveedor || 'N/A'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {historial.length === 0 && <div style={{padding: 20, textAlign: 'center', color: '#9CA3AD'}}>No hay movimientos para este artículo.</div>}
        </div>
      </div>
    </div>
  );
}