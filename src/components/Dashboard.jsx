import React, { useRef } from 'react';
import { Package, Download, Upload, Copy, FileText, Users, Activity, ArrowLeft, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function Dashboard({ nacionMovs, provinciaMovs, listaUsuarios, auditoria, onVolver, onCrearCopiaAhora, onDescargarRespaldo, onDescargarRespaldoExcel, onDescargarRespaldoPDF, onRestaurarRespaldo }) {
  
  // 1. Cálculos de métricas en tiempo real basados en tu Firebase
  const totalMovimientos = nacionMovs.length + provinciaMovs.length;
  
  const ingresosNacion = nacionMovs.filter(m => m.tipo === 'ingreso').length;
  const egresosNacion = nacionMovs.filter(m => m.tipo === 'egreso').length;
  const ingresosProv = provinciaMovs.filter(m => m.tipo === 'ingreso').length;
  const egresosProv = provinciaMovs.filter(m => m.tipo === 'egreso').length;

  const allMovs = [...nacionMovs, ...provinciaMovs];
  const hoy = new Date();
  const diferenciaDias = (fecha) => {
    if (!fecha) return null;
    const venc = new Date(fecha);
    const ms = venc.setHours(0, 0, 0, 0) - hoy.setHours(0, 0, 0, 0);
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  };

  const productosVencidos = allMovs.filter((m) => m.fechaVencimiento && diferenciaDias(m.fechaVencimiento) < 0).length;
  const productosPorVencer = allMovs.filter((m) => m.fechaVencimiento && diferenciaDias(m.fechaVencimiento) >= 0 && diferenciaDias(m.fechaVencimiento) <= 30).length;
  const remitosPendientes = allMovs.filter((m) => String(m.estadoRemito || 'Pendiente') === 'Pendiente').length;
  const remitosRecibidos = allMovs.filter((m) => String(m.estadoRemito || 'Pendiente') === 'Recibido').length;
  const remitosCerrados = allMovs.filter((m) => String(m.estadoRemito || 'Pendiente') === 'Cerrado').length;

  const totalIngresos = ingresosNacion + ingresosProv;
  const totalEgresos = egresosNacion + egresosProv;

  const articulosNacionUnicos = new Set(nacionMovs.filter(m => m?.descripcion).map(m => m.descripcion)).size;
  const articulosProvinciaUnicos = new Set(provinciaMovs.filter(m => m?.descripcion).map(m => m.descripcion)).size;

  // 2. Gráfico 1: Comparativa de depósitos (Nación vs Provincia)
  const dataComparativa = [
    { name: 'Nación', Ingresos: ingresosNacion, Egresos: egresosNacion },
    { name: 'Provincia', Ingresos: ingresosProv, Egresos: egresosProv },
  ];

  // 3. Gráfico 2: Top Productos más movidos (Mapeo dinámico de descripciones)
  const todasLasDescripciones = [...nacionMovs, ...provinciaMovs].map(m => m.descripcion || 'Sin descripción');
  const conteoProductos = todasLasDescripciones.reduce((acc, desc) => {
    acc[desc] = (acc[desc] || 0) + 1;
    return acc;
  }, {});

  const productosTop = Object.entries(conteoProductos)
    .map(([name, cantidad]) => ({ name: name.substring(0, 15), cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  const fileInputRef = useRef(null);

  // 4. Tabla: Últimos 5 movimientos globales en tiempo real
  const ultimosMovimientos = [...nacionMovs.map(m => ({ ...m, origen: 'Nación' })), ...provinciaMovs.map(m => ({ ...m, origen: 'Provincia' }))]
    .sort((a, b) => new Date(b.fechaCarga || b.fecha) - new Date(a.fechaCarga || a.fecha))
    .slice(0, 5);

  const manejarArchivoRespaldo = async (event) => {
    const archivo = event.target.files?.[0];
    if (!archivo) return;

    try {
      const texto = await archivo.text();
      const data = JSON.parse(texto);
      if (onRestaurarRespaldo) onRestaurarRespaldo(data);
      window.alert('Respaldo restaurado correctamente.');
    } catch (err) {
      console.error('Error al leer el respaldo:', err);
      window.alert('No se pudo restaurar el respaldo. Verifique el archivo.');
    } finally {
      event.target.value = null;
    }
  };

  const abrirSelectorRestaurar = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '18px 14px', fontFamily: "'Inter',system-ui,sans-serif" }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={onVolver} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1A3A5C', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          <ArrowLeft size={16} /> Volver al Inventario
        </button>
        <div style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '1px' }}>
          Panel Analítico SGI
        </div>
      </div>

      {/* Acciones de respaldo */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <button onClick={() => onCrearCopiaAhora && onCrearCopiaAhora()} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#E2E8F0', color: '#0F172A', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          <Copy size={16} /> Crear copia ahora
        </button>
        <button onClick={() => onDescargarRespaldo && onDescargarRespaldo()} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1A3A5C', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          <Download size={16} /> Descargar respaldo JSON
        </button>
        <button onClick={() => onDescargarRespaldoExcel && onDescargarRespaldoExcel()} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#047857', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          <FileText size={16} /> Descargar respaldo Excel
        </button>
        <button onClick={() => onDescargarRespaldoPDF && onDescargarRespaldoPDF()} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#9333EA', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          <FileText size={16} /> Descargar respaldo PDF
        </button>
        <button onClick={abrirSelectorRestaurar} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2563EB', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          <Upload size={16} /> Restaurar respaldo
        </button>
        <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={manejarArchivoRespaldo} />
      </div>

      {/* Tarjetas Dinámicas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: "Artículos Únicos (Nac)", val: articulosNacionUnicos, icon: Package, col: "#1A3A5C" },
          { label: "Artículos Únicos (Prov)", val: articulosProvinciaUnicos, icon: Package, col: "#2E7DC4" },
          { label: "Total Ingresos", val: totalIngresos, icon: Download, col: "#10B981" },
          { label: "Total Egresos", val: totalEgresos, icon: Upload, col: "#F97316" },
          { label: "Movimientos Totales", val: totalMovimientos, icon: FileText, col: "#C8993A" },
          { label: "Remitos Pendientes", val: remitosPendientes, icon: Clock, col: "#F59E0B" },
          { label: "Remitos Cerrados", val: remitosCerrados, icon: CheckCircle, col: "#10B981" },
          { label: "Productos Vencidos", val: productosVencidos, icon: AlertTriangle, col: "#DC2626" },
          { label: "Por vencer (30d)", val: productosPorVencer, icon: AlertTriangle, col: "#F59E0B" },
          { label: "Usuarios Registrados", val: listaUsuarios.length, icon: Users, col: "#6366F1" },
          { label: "Registros Auditoría", val: auditoria.length, icon: Activity, col: "#475569" },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderTop: `4px solid ${card.col}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{card.label}</span>
                <Icon size={16} color={card.col} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', marginTop: 6 }}>{card.val}</div>
            </div>
          )
        })}
      </div>

      {/* Alertas de vencimiento */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>Productos vencidos</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Items con fecha de vencimiento pasada</div>
            </div>
            <AlertTriangle size={24} color="#DC2626" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#DC2626' }}>{productosVencidos}</div>
        </div>

        <div style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>Vencen en 30 días</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Items próximos a expirar</div>
            </div>
            <Clock size={24} color="#D97706" />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#D97706' }}>{productosPorVencer}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>Productos próximos a vencer</div>
          </div>
          <div style={{ padding: 16 }}>
            {allMovs.filter((m) => m.fechaVencimiento && diferenciaDias(m.fechaVencimiento) >= 0 && diferenciaDias(m.fechaVencimiento) <= 30).slice(0, 5).map((mov, idx) => (
              <div key={mov.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: idx < 4 ? 12 : 0, paddingBottom: idx < 4 ? 12 : 0, borderBottom: idx < 4 ? '1px solid #F1F5F9' : 'none' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#1E293B' }}>{mov.descripcion}</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>{mov.categoria} · {mov.cantidad} {mov.unidad}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#D97706' }}>{new Date(mov.fechaVencimiento).toLocaleDateString()}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>{diferenciaDias(mov.fechaVencimiento)} días</div>
                </div>
              </div>
            ))}
            {productosPorVencer === 0 && <div style={{ color: '#94A3B8', fontSize: 13 }}>No hay productos próximos a vencer.</div>}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>Remitos pendientes</div>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, color: '#1E293B' }}>Pendientes</span><span style={{ color: '#D97706' }}>{remitosPendientes}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, color: '#1E293B' }}>Recibidos</span><span style={{ color: '#0F766E' }}>{remitosRecibidos}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, color: '#1E293B' }}>Cerrados</span><span style={{ color: '#1D4ED8' }}>{remitosCerrados}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16, marginBottom: 20 }}>
        
        {/* Gráfico 1: Barras */}
        <div style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#1E293B' }}>Flujo: Ingresos vs Egresos</h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={dataComparativa}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Egresos" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Área */}
        <div style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#1E293B' }}>Productos con Mayor Frecuencia de Carga</h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <AreaChart data={productosTop} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="cantidad" name="Movimientos" stroke="#1A3A5C" fill="#E2E8F0" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Tabla Recientes */}
      <div style={{ background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#1E293B' }}>Últimos 5 Movimientos Registrados</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', color: '#64748B', textAlign: 'left' }}>
              <th style={{ padding: 8 }}>Depósito</th>
              <th style={{ padding: 8 }}>Tipo</th>
              <th style={{ padding: 8 }}>Descripción</th>
              <th style={{ padding: 8 }}>Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {ultimosMovimientos.map((m, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: 8, fontWeight: 600 }}>{m.origen}</td>
                <td style={{ padding: 8 }}>
                  <span style={{ padding: '2px 6px', borderRadius: 4, fontWeight: 700, fontSize: 10, background: m.tipo === 'ingreso' ? '#D1FAE5' : '#FFEDD5', color: m.tipo === 'ingreso' ? '#065F46' : '#9A3412' }}>
                    {m.tipo.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: 8 }}>{m.descripcion}</td>
                <td style={{ padding: 8, fontWeight: 700 }}>{m.cantidad} {m.unidad}</td>
                <td style={{ padding: 8 }}><span style={{ padding: '4px 8px', borderRadius: 6, background: '#EFF6FF', color: '#1E40AF', fontWeight: 700, fontSize: 11 }}>{m.estadoRemito || 'Pendiente'}</span></td>
                <td style={{ padding: 8 }}>
                  {m.fechaVencimiento ? (
                    <span style={{ padding: '4px 8px', borderRadius: 6, background: new Date(m.fechaVencimiento) < new Date() ? '#FEE2E2' : '#F8FAFC', color: new Date(m.fechaVencimiento) < new Date() ? '#B91C1C' : '#0F172A', fontWeight: 700, fontSize: 11 }}>
                      {new Date(m.fechaVencimiento).toLocaleDateString()}
                    </span>
                  ) : (
                    <span style={{ color: '#94A3B8', fontSize: 11 }}>Sin fecha</span>) }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}