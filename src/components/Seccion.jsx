import { useState } from "react";
import { utils, writeFile } from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export default function Seccion({ nombre, color, colorClaro, datos, onCarga, onActualizar, usuarioActual, onAudit }) {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
  const [pestaña, setPestaña] = useState("stock"); // 'stock' o 'historial'

  // 🛡️ ADAPTADOR CRÍTICO: Si "datos.movimientos" es un objeto de Firebase, lo transformamos a Array al toque
  const movimientos = (() => {
    if (!datos || !datos.movimientos) return [];
    if (Array.isArray(datos.movimientos)) return datos.movimientos.filter(Boolean);
    if (typeof datos.movimientos === "object") return Object.values(datos.movimientos).filter(Boolean);
    return [];
  })();

  const esAdmin = usuarioActual?.rol === "admin";

  // Procesar stock consolidado (Agrupar por Categoría + Descripción)
  const stockConsolidado = {};
  movimientos.forEach((mov) => {
    const clave = `${mov.categoria || "General"}⁻⁻⁻${mov.descripcion}`;
    if (!stockConsolidado[clave]) {
      stockConsolidated[clave] = {
        categoria: mov.categoria || "General",
        descripcion: mov.descripcion,
        cantidad: 0,
        unidad: mov.unidad || "unidades",
      };
    }
    stockConsolidado[clave].cantidad += Number(mov.cantidad || 0);
  });

  const listaStock = Object.values(stockConsolidado);

  // Extraer categorías únicas para el selector de filtros
  const categoriasUnicas = ["Todas", ...new Set(movimientos.map((m) => m.categoria || "General"))];

  // Filtrado adaptativo para la tabla de Stock
  const stockFiltrado = listaStock.filter((item) => {
    const coincideBusqueda = item.descripcion.toLowerCase().includes(busqueda.toLowerCase()) || item.categoria.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaFiltro === "Todas" || item.categoria === categoriaFiltro;
    return coincideBusqueda && coincideCategoria;
  });

  // Filtrado adaptativo para la tabla de Historial (ordenado por fecha descendente)
  const historialFiltrado = [...movimientos]
    .sort((a, b) => new Date(b.fechaCarga) - new Date(a.fechaCarga))
    .filter((mov) => {
      const coincideBusqueda = mov.descripcion.toLowerCase().includes(busqueda.toLowerCase()) || (mov.nroRemito && mov.nroRemito.toLowerCase().includes(busqueda.toLowerCase()));
      const coincideCategoria = categoriaFiltro === "Todas" || mov.categoria === categoriaFiltro;
      return coincideBusqueda && coincideCategoria;
    });

  // Funciones de exportación seguras
  const exportarExcel = () => {
    const dataExport = pestaña === "stock" 
      ? stockFiltrado.map(i => ({ Categoría: i.categoria, Descripción: i.descripcion, Cantidad: i.cantidad, Unidad: i.unidad }))
      : historialFiltrado.map(h => ({ Fecha: new Date(h.fechaCarga).toLocaleDateString(), Remito: h.nroRemito, Categoría: h.categoria, Descripción: h.descripcion, Cantidad: h.cantidad, Unidad: h.unidad, Operario: h.cargadoPor }));

    const wb = utils.book_new();
    const ws = utils.json_to_sheet(dataExport);
    utils.book_append_sheet(wb, ws, pestaña === "stock" ? "Stock Actual" : "Historial");
    writeFile(wb, `${nombre}-${pestaña}.xlsx`);
    if (onAudit) onAudit({ tipo: "exportar", detalle: `Exportó Excel de ${nombre} (${pestaña})` });
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text(`${nombre} - Reporte de ${pestaña === "stock" ? "Stock" : "Historial"}`, 14, 15);
    
    const headers = pestaña === "stock" 
      ? [["Categoría", "Descripción", "Cantidad", "Unidad"]]
      : [["Fecha", "Remito", "Categoría", "Descripción", "Cant.", "Unidad", "Usuario"]];

    const body = pestaña === "stock"
      ? stockFiltrado.map(i => [i.categoria, i.descripcion, i.cantidad, i.unidad])
      : historialFiltrado.map(h => [new Date(h.fechaCarga).toLocaleDateString(), h.nroRemito, h.categoria, h.descripcion, h.cantidad, h.unidad, h.cargadoPor]);

    doc.autoTable({ head: headers, body: body, startY: 22, theme: "striped" });
    doc.save(`${nombre}-${pestaña}.pdf`);
    if (onAudit) onAudit({ tipo: "exportar", detalle: `Exportó PDF de ${nombre} (${pestaña})` });
  };

  return (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.04)", overflow: "hidden", border: "1px solid #E2E8F0" }}>
      {/* Encabezado Control */}
      <div style={{ background: `linear-gradient(135deg, ${color}, ${colorClaro})`, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ color: "#fff", margin: 0, fontSize: 16, fontWeight: 800 }}>{nombre}</h2>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>
            {listaStock.length} ítems registrados · {movimientos.length} movimientos en total
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onCarga} style={{ background: "#F59E0B", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>+ Nueva Carga</button>
          <button onClick={exportarExcel} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, padding: "7px 10px", fontSize: 11, cursor: "pointer" }}>📊 Excel</button>
          <button onClick={exportarPDF} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, padding: "7px 10px", fontSize: 11, cursor: "pointer" }}>📄 PDF</button>
        </div>
      </div>

      {/* Selectores de Pestaña */}
      <div style={{ display: "flex", borderBottom: "1px solid #E2E8F0" }}>
        <button onClick={() => setPestaña("stock")} style={{ flex: 1, padding: "12px", background: "none", border: "none", borderBottom: pestaña === "stock" ? `3px solid ${color}` : "3px solid transparent", color: pestaña === "stock" ? color : "#64748B", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>📦 Stock Consolidado</button>
        <button onClick={() => setPestaña("historial")} style={{ flex: 1, padding: "12px", background: "none", border: "none", borderBottom: pestaña === "historial" ? `3px solid ${color}` : "3px solid transparent", color: pestaña === "historial" ? color : "#64748B", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>📜 Historial de Remitos</button>
      </div>

      {/* Barra de Filtros */}
      <div style={{ padding: "12px 16px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input type="text" placeholder="Buscar por descripción..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ flex: 1, minWidth: 180, padding: "7px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 12 }} />
        <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 12, background: "#fff" }}>
          {categoriasUnicas.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {/* Contenedor de Tablas */}
      <div style={{ overflowX: "auto", padding: "8px" }}>
        {pestaña === "stock" ? (
          stockFiltrado.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No hay artículos cargados o no coinciden con la búsqueda.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E2E8F0", color: "#64748B" }}>
                  <th style={{ padding: "10px" }}>Categoría</th>
                  <th style={{ padding: "10px" }}>Descripción</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Stock Total</th>
                </tr>
              </thead>
              <tbody>
                {stockFiltrado.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9", background: idx % 2 === 0 ? "#fff" : "#F8FAFC" }}>
                    <td style={{ padding: "10px" }}><span style={{ background: "#E2E8F0", padding: "2px 6px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{item.categoria}</span></td>
                    <td style={{ padding: "10px", fontWeight: 600, color: "#1E293B" }}>{item.descripcion}</td>
                    <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: item.cantidad > 0 ? "#16A34A" : "#DC2626" }}>{item.cantidad} {item.unidad}</td>
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
                  <th style={{ padding: "10px" }}>Remito</th>
                  <th style={{ padding: "10px" }}>Artículo</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Cantidad</th>
                  <th style={{ padding: "10px" }}>Operario</th>
                </tr>
              </thead>
              <tbody>
                {historialFiltrado.map((mov, idx) => (
                  <tr key={mov.id || idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px", color: "#64748B" }}>{new Date(mov.fechaCarga).toLocaleDateString()}</td>
                    <td style={{ padding: "10px", fontWeight: 700, color: "#475569" }}>📄 {mov.nroRemito || "s/n"}</td>
                    <td style={{ padding: "10px" }}>
                      <div style={{ fontWeight: 600, color: "#1E293B" }}>{mov.descripcion}</div>
                      <span style={{ fontSize: 10, color: "#94A3B8" }}>{mov.categoria}</span>
                    </td>
                    <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: "#2563EB" }}>{mov.cantidad} {mov.unidad}</td>
                    <td style={{ padding: "10px", color: "#64748B", fontSize: 11 }}>👤 {mov.cargadoPor || "Sistema"}</td>
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