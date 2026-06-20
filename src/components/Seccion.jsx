import { useState } from "react";
import { CATEGORIAS } from "../constants.js";
import { formatFechaCorta } from "../constants.js";
import { inputStyle } from "../styles.js";
import { StockBadge } from "./Common.jsx";
import ModalDetalle from "./ModalDetalle.jsx";
import ModalRemito from "./ModalRemito.jsx";
import { exportarExcel, exportarPDF } from "../exportUtils.js";
import { eliminarFotoRemito } from "../fotoStorage.js";

export default function Seccion({ nombre, color, colorClaro, datos, onCarga, onActualizar, usuarioActual, onAudit, auditoria }) {
  const [tab, setTab] = useState("stock");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [movDetalle, setMovDetalle] = useState(null);
  const [movEditar, setMovEditar] = useState(null);
  const esAdmin = usuarioActual.rol === "admin";

  const stockPorArticulo = {};
  datos.movimientos.forEach((m) => {
    const key = `${m.categoria}||${m.descripcion}`;
    if (!stockPorArticulo[key]) stockPorArticulo[key] = { categoria: m.categoria, descripcion: m.descripcion, unidad: m.unidad, total: 0 };
    stockPorArticulo[key].total += m.tipo === "ingreso" ? m.cantidad : -m.cantidad;
  });

  const aplicarFiltros = (arr) =>
    arr.filter((x) => {
      if (filtroCategoria !== "todas" && x.categoria !== filtroCategoria) return false;
      if (filtroBusqueda && !x.descripcion?.toLowerCase().includes(filtroBusqueda.toLowerCase()) && !x.nroRemito?.toLowerCase().includes(filtroBusqueda.toLowerCase())) return false;
      if (filtroTipo !== "todos" && x.tipo && x.tipo !== filtroTipo) return false;
      return true;
    });

  const stockList = aplicarFiltros(Object.values(stockPorArticulo));
  const movFiltrados = aplicarFiltros([...datos.movimientos]).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const editarMovimiento = (mov) => {
    setMovDetalle(null);
    setMovEditar(mov);
  };

  const eliminarMovimiento = async (mov) => {
    if (!window.confirm(`¿Eliminar el movimiento "${mov.descripcion}"?`)) return;
    onActualizar((prev) => ({ ...prev, movimientos: prev.movimientos.filter((m) => m.id !== mov.id) }));
    onAudit({ tipo: "eliminacion", usuario: usuarioActual.nombre, rol: usuarioActual.rol, detalle: `Eliminó movimiento "${mov.descripcion}" (${mov.cantidad} ${mov.unidad}) en ${nombre}` });
    setMovDetalle(null);
    if (mov.foto) eliminarFotoRemito(mov.foto);
  };

  const guardarEdicion = (movEditado) => {
    onActualizar((prev) => ({
      ...prev,
      movimientos: prev.movimientos.map((m) =>
        m.id === movEditado.id ? { ...movEditado, editadoPor: usuarioActual.nombre, fechaEdicion: new Date().toISOString() } : m
      ),
    }));
    onAudit({ tipo: "edicion", usuario: usuarioActual.nombre, rol: usuarioActual.rol, detalle: `Editó movimiento "${movEditado.descripcion}" en ${nombre}` });
    setMovEditar(null);
  };

  return (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden", border: `1px solid ${colorClaro}40` }}>
      <div style={{ background: `linear-gradient(135deg,${color},${colorClaro})`, padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 9, letterSpacing: 3, fontWeight: 700 }}>MINISTERIO DE DESARROLLO HUMANO</div>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginTop: 2 }}>{nombre}</div>
            <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
              <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 12 }}><span style={{ fontWeight: 700, fontSize: 15 }}>{Object.keys(stockPorArticulo).length}</span> artículos</div>
              <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 12 }}><span style={{ fontWeight: 700, fontSize: 15 }}>{datos.movimientos.length}</span> movimientos</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
            <button onClick={onCarga} style={{ background: "#C8993A", color: "#fff", border: "none", borderRadius: 9, padding: "9px 14px", fontWeight: 700, cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" }}>
              + Nueva Carga
            </button>
            <div style={{ display: "flex", gap: 5 }}>
              <button onClick={() => exportarExcel(datos.movimientos, nombre.replace("Inventario — ", ""), auditoria, usuarioActual, onAudit)} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 7, padding: "5px 9px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                📊 Excel
              </button>
              <button onClick={() => exportarPDF(datos.movimientos, nombre.replace("Inventario — ", ""), usuarioActual, onAudit)} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 7, padding: "5px 9px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                📄 PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "2px solid #F1F5F9", background: "#FAFAFA" }}>
        {[{ k: "stock", l: "📊 Stock" }, { k: "historial", l: "📋 Historial" }].map(({ k, l }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{ flex: 1, padding: "11px", border: "none", background: "none", fontWeight: tab === k ? 700 : 500, fontSize: 13, color: tab === k ? color : "#64748B", borderBottom: tab === k ? `2px solid ${color}` : "2px solid transparent", marginBottom: -2, cursor: "pointer" }}
          >
            {l}
          </button>
        ))}
      </div>

      <div style={{ padding: "12px 14px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input type="text" placeholder="🔍 Buscar..." value={filtroBusqueda} onChange={(e) => setFiltroBusqueda(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 120, fontSize: 12, padding: "7px 10px" }} />
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} style={{ ...inputStyle, fontSize: 12, padding: "7px 10px", minWidth: 0 }}>
          <option value="todas">Todas</option>
          {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        {tab === "historial" && (
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ ...inputStyle, fontSize: 12, padding: "7px 10px", minWidth: 0 }}>
            <option value="todos">Todos</option>
            <option value="ingreso">📥 Ingresos</option>
            <option value="egreso">📤 Egresos</option>
          </select>
        )}
      </div>

      <div style={{ minHeight: 180, maxHeight: 360, overflowY: "auto" }}>
        {tab === "stock" ? (
          stockList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94A3B8" }}>
              <div style={{ fontSize: 38 }}>📦</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Sin artículos — Cargá el primer remito</div>
            </div>
          ) : (
            stockList.map((s) => {
              const cat = CATEGORIAS.find((c) => c.id === s.categoria);
              return (
                <div key={`${s.categoria}||${s.descripcion}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", borderBottom: "1px solid #F1F5F9", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{cat?.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.descripcion}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8" }}>{cat?.label}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <StockBadge cantidad={s.total} />
                    <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{s.unidad}</div>
                  </div>
                </div>
              );
            })
          )
        ) : movFiltrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#94A3B8" }}>
            <div style={{ fontSize: 38 }}>📋</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Sin movimientos</div>
          </div>
        ) : (
          movFiltrados.map((m) => {
            const cat = CATEGORIAS.find((c) => c.id === m.categoria);
            return (
              <div
                key={m.id}
                onClick={() => setMovDetalle(m)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #F1F5F9", cursor: "pointer", gap: 8 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{m.tipo === "ingreso" ? "📥" : "📤"}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.descripcion}</div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>
                      {formatFechaCorta(m.fecha)}
                      {m.nroRemito ? ` · ${m.nroRemito}` : ""}
                      {m.cargadoPor ? ` · ${m.cargadoPor}` : ""}
                      {m.foto ? " · 📷" : ""}
                      {m.editadoPor ? " · ✏️" : ""}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: m.tipo === "ingreso" ? "#059669" : "#DC2626" }}>
                    {m.tipo === "ingreso" ? "+" : "-"}
                    {m.cantidad}
                  </span>
                  <div style={{ fontSize: 10, color: "#94A3B8" }}>{m.unidad}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {movDetalle && (
        <ModalDetalle mov={movDetalle} onClose={() => setMovDetalle(null)} esAdmin={esAdmin} onEditar={() => editarMovimiento(movDetalle)} onEliminar={() => eliminarMovimiento(movDetalle)} />
      )}
      {movEditar && <ModalRemito seccionNombre={nombre} onClose={() => setMovEditar(null)} onGuardar={guardarEdicion} movimientoEditar={movEditar} esEdicion />}
    </div>
  );
}
