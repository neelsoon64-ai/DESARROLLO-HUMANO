import React, { useMemo, useState } from "react";
import { CATEGORIAS, UNIDADES, formatFechaCorta, generarId, obtenerFechaLocal } from "../constants.js";
import { calcularStockDetallado } from "../inventoryModel.js";

const boton = { border: 0, borderRadius: 8, padding: "9px 14px", background: "#1D4ED8", color: "#fff", fontWeight: 700, cursor: "pointer" };
const caja = { background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 16, marginBottom: 16 };
const campo = { width: "100%", boxSizing: "border-box", padding: "9px 10px", border: "1px solid #D1D5DB", borderRadius: 8, background: "#fff" };
const inicialLinea = () => ({ key: generarId(), descripcion: "", categoria: CATEGORIAS[0].id, cantidad: "", unidad: "unidades" });

export default function PaginaExpedientes({
  nacion,
  provincia,
  todosLosMovimientos,
  puedeEscribir,
  onCrearExpediente,
  onCrearCompra,
  onAsignarExpediente,
}) {
  const [numeroExpediente, setNumeroExpediente] = useState("");
  const [descripcionExpediente, setDescripcionExpediente] = useState("");
  const [seccionExpediente, setSeccionExpediente] = useState("nacion");
  const [compra, setCompra] = useState({ expedienteId: "", seccion: "nacion", remitoNumero: "", ordenCompra: "", proveedor: "", fechaCompra: obtenerFechaLocal() });
  const [lineas, setLineas] = useState([inicialLinea()]);
  const [busqueda, setBusqueda] = useState("");
  const [expedientesAsignacion, setExpedientesAsignacion] = useState({});
  const [compraAbierta, setCompraAbierta] = useState("");
  const [error, setError] = useState("");

  const expedientes = useMemo(
    () => [
      ...(Array.isArray(nacion?.expedientes) ? nacion.expedientes : []).map((item) => ({ ...item, seccion: "nacion" })),
      ...(Array.isArray(provincia?.expedientes) ? provincia.expedientes : []).map((item) => ({ ...item, seccion: "provincia" })),
    ],
    [nacion?.expedientes, provincia?.expedientes]
  );

  const compras = useMemo(
    () => [
      ...(Array.isArray(nacion?.compras) ? nacion.compras : []).map((item) => ({ ...item, seccion: "nacion" })),
      ...(Array.isArray(provincia?.compras) ? provincia.compras : []).map((item) => ({ ...item, seccion: "provincia" })),
    ].sort((a, b) => String(b.fechaCompra || "").localeCompare(String(a.fechaCompra || ""))),
    [nacion?.compras, provincia?.compras]
  );

  const movimientosPorCompra = useMemo(() => calcularStockDetallado(todosLosMovimientos), [todosLosMovimientos]);
  const movimientosPendientes = useMemo(
    () => todosLosMovimientos.filter((movimiento) => !movimiento.compraId || !movimiento.numero_expediente),
    [todosLosMovimientos]
  );
  const comprasFiltradas = compras.filter((item) => {
    const texto = busqueda.trim().toLocaleLowerCase();
    if (!texto) return true;
    const expediente = expedientes.find((actual) => actual.id === item.expedienteId);
    return [item.compraId, item.remitoNumero, item.ordenCompra, item.proveedor, expediente?.numeroExpediente, expediente?.descripcion]
      .some((valor) => String(valor || "").toLocaleLowerCase().includes(texto));
  });

  const registrarExpediente = async (event) => {
    event.preventDefault();
    setError("");
    const numero = numeroExpediente.trim().toUpperCase();
    if (!numero) return setError("Ingresá el número de expediente.");
    if (expedientes.some((item) => String(item.numeroExpediente || "").toUpperCase() === numero)) {
      return setError("Ese número de expediente ya está registrado.");
    }
    try {
      await onCrearExpediente({
        seccion: seccionExpediente,
        expediente: { id: generarId(), numeroExpediente: numero, descripcion: descripcionExpediente.trim(), fechaCreacion: obtenerFechaLocal() },
      });
      setNumeroExpediente("");
      setDescripcionExpediente("");
    } catch (err) {
      console.error("No se pudo crear el expediente:", err);
      setError("No se pudo guardar el expediente. Revisá la conexión e intentá nuevamente.");
    }
  };

  const registrarCompra = async (event) => {
    event.preventDefault();
    setError("");
    const expediente = expedientes.find((item) => item.id === compra.expedienteId);
    const lineasValidas = lineas.map((linea) => ({ ...linea, descripcion: linea.descripcion.trim(), cantidad: Number(linea.cantidad) }));
    if (!expediente) return setError("Seleccioná el expediente de esta compra.");
    if (expediente.seccion !== compra.seccion) return setError("La compra debe registrarse en la misma sección que su expediente.");
    if (lineasValidas.length === 0 || lineasValidas.some((linea) => !linea.descripcion || !Number.isFinite(linea.cantidad) || linea.cantidad <= 0)) {
      return setError("Completá la descripción y una cantidad válida para cada artículo.");
    }
    try {
      await onCrearCompra({
        seccion: compra.seccion,
        expediente,
        compra: { compraId: generarId(), remitoNumero: compra.remitoNumero.trim(), ordenCompra: compra.ordenCompra.trim().toUpperCase(), proveedor: compra.proveedor.trim(), fechaCompra: compra.fechaCompra },
        lineas: lineasValidas,
      });
      setCompra((actual) => ({ ...actual, remitoNumero: "", ordenCompra: "", proveedor: "" }));
      setLineas([inicialLinea()]);
    } catch (err) {
      console.error("No se pudo registrar la compra:", err);
      setError("No se pudo guardar la compra. Revisá la conexión e intentá nuevamente.");
    }
  };

  const asignarExpediente = async (movimiento) => {
    const key = `${movimiento.origen}:${movimiento.id}`;
    const expediente = expedientes.find((item) => item.id === expedientesAsignacion[key]);
    if (!expediente) return;
    setError("");
    try {
      await onAsignarExpediente(movimiento, expediente);
      setExpedientesAsignacion((actual) => ({ ...actual, [key]: "" }));
    } catch (err) {
      console.error("No se pudo asignar el expediente al movimiento:", err);
      setError("No se pudo actualizar el registro histórico.");
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: "0 0 16px" }}>Expedientes y Compras</h1>
      {error && <div role="alert" style={{ ...caja, color: "#991B1B", background: "#FEF2F2", borderColor: "#FECACA" }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        <form onSubmit={registrarExpediente} style={caja}>
          <h2 style={{ margin: "0 0 12px", fontSize: 17 }}>Crear expediente</h2>
          <div style={{ display: "grid", gap: 10 }}>
            <input style={campo} value={numeroExpediente} onChange={(event) => setNumeroExpediente(event.target.value)} placeholder="Número de expediente" aria-label="Número de expediente" disabled={!puedeEscribir} />
            <input style={campo} value={descripcionExpediente} onChange={(event) => setDescripcionExpediente(event.target.value)} placeholder="Descripción (opcional)" aria-label="Descripción del expediente" disabled={!puedeEscribir} />
            <select style={campo} value={seccionExpediente} onChange={(event) => setSeccionExpediente(event.target.value)} disabled={!puedeEscribir}>
              <option value="nacion">Inventario — Nación</option><option value="provincia">Inventario — Provincia</option>
            </select>
            <button style={{ ...boton, opacity: puedeEscribir ? 1 : 0.5 }} type="submit" disabled={!puedeEscribir}>Crear expediente</button>
          </div>
        </form>

        <form onSubmit={registrarCompra} style={caja}>
          <h2 style={{ margin: "0 0 12px", fontSize: 17 }}>Registrar compra</h2>
          <div style={{ display: "grid", gap: 10 }}>
            <select style={campo} value={compra.expedienteId} onChange={(event) => {
              const expediente = expedientes.find((item) => item.id === event.target.value);
              setCompra((actual) => ({ ...actual, expedienteId: event.target.value, seccion: expediente?.seccion || actual.seccion }));
            }} disabled={!puedeEscribir}>
              <option value="">Seleccionar expediente</option>
              {expedientes.map((item) => <option key={`${item.seccion}:${item.id}`} value={item.id}>{item.numeroExpediente} — {item.seccion === "nacion" ? "Nación" : "Provincia"}</option>)}
            </select>
            <select style={campo} value={compra.seccion} onChange={(event) => setCompra((actual) => ({ ...actual, seccion: event.target.value }))} disabled={!puedeEscribir}>
              <option value="nacion">Inventario — Nación</option><option value="provincia">Inventario — Provincia</option>
            </select>
            <input style={campo} type="date" value={compra.fechaCompra} onChange={(event) => setCompra((actual) => ({ ...actual, fechaCompra: event.target.value }))} disabled={!puedeEscribir} />
            <input style={campo} value={compra.remitoNumero} onChange={(event) => setCompra((actual) => ({ ...actual, remitoNumero: event.target.value }))} placeholder="Número de remito (opcional)" disabled={!puedeEscribir} />
            <input style={campo} value={compra.ordenCompra} onChange={(event) => setCompra((actual) => ({ ...actual, ordenCompra: event.target.value }))} placeholder="Orden de compra (opcional)" disabled={!puedeEscribir} />
            <input style={campo} value={compra.proveedor} onChange={(event) => setCompra((actual) => ({ ...actual, proveedor: event.target.value }))} placeholder="Proveedor (opcional)" disabled={!puedeEscribir} />
          </div>
          <h3 style={{ fontSize: 14, margin: "16px 0 8px" }}>Artículos de la compra</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {lineas.map((linea, index) => (
              <div key={linea.key} style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: 10, display: "grid", gap: 8 }}>
                <input style={campo} value={linea.descripcion} onChange={(event) => setLineas((actual) => actual.map((item) => item.key === linea.key ? { ...item, descripcion: event.target.value } : item))} placeholder={`Artículo ${index + 1}`} disabled={!puedeEscribir} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <select style={campo} value={linea.categoria} onChange={(event) => setLineas((actual) => actual.map((item) => item.key === linea.key ? { ...item, categoria: event.target.value } : item))} disabled={!puedeEscribir}>
                    {CATEGORIAS.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.label}</option>)}
                  </select>
                  <input style={campo} type="number" min="0.01" step="any" value={linea.cantidad} onChange={(event) => setLineas((actual) => actual.map((item) => item.key === linea.key ? { ...item, cantidad: event.target.value } : item))} placeholder="Cantidad" disabled={!puedeEscribir} />
                </div>
                <select style={campo} value={linea.unidad} onChange={(event) => setLineas((actual) => actual.map((item) => item.key === linea.key ? { ...item, unidad: event.target.value } : item))} disabled={!puedeEscribir}>
                  {UNIDADES.map((unidad) => <option key={unidad} value={unidad}>{unidad}</option>)}
                </select>
                {lineas.length > 1 && <button type="button" onClick={() => setLineas((actual) => actual.filter((item) => item.key !== linea.key))} disabled={!puedeEscribir} style={{ ...boton, background: "#FEE2E2", color: "#991B1B" }}>Quitar artículo</button>}
              </div>
            ))}
            <button type="button" onClick={() => setLineas((actual) => [...actual, inicialLinea()])} disabled={!puedeEscribir} style={{ ...boton, background: "#EFF6FF", color: "#1D4ED8" }}>+ Agregar artículo</button>
            <button type="submit" disabled={!puedeEscribir || expedientes.length === 0} style={{ ...boton, opacity: puedeEscribir && expedientes.length > 0 ? 1 : 0.5 }}>Guardar compra y sus artículos</button>
          </div>
        </form>
      </div>

      <section style={caja}>
        <h2 style={{ margin: "0 0 12px", fontSize: 17 }}>Compras registradas</h2>
        <input style={{ ...campo, marginBottom: 12 }} value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar expediente, compra, remito o proveedor..." />
        <div style={{ display: "grid", gap: 10 }}>
          {comprasFiltradas.map((item) => {
            const expediente = expedientes.find((actual) => actual.id === item.expedienteId);
            const lineasCompra = movimientosPorCompra.filter(
              (articulo) => articulo.compraId === item.compraId && articulo.origen === item.seccion
            );
            const abierta = compraAbierta === item.compraId;
            return (
              <article key={`${item.seccion}:${item.compraId}`} style={{ border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
                <button type="button" onClick={() => setCompraAbierta(abierta ? "" : item.compraId)} style={{ width: "100%", textAlign: "left", border: 0, padding: 14, background: "#F9FAFB", cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <span><strong>Expediente {expediente?.numeroExpediente || "no identificado"}</strong>{" · Compra "}{item.ordenCompra || item.compraId}{item.remitoNumero ? ` · Remito ${item.remitoNumero}` : ""}</span>
                  <span>{formatFechaCorta(item.fechaCompra)} · {item.proveedor || "Sin proveedor"}</span>
                </button>
                {abierta && (
                  <div style={{ overflowX: "auto", padding: 12 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #E5E7EB" }}><th style={{ padding: 8 }}>Artículo / categoría</th><th style={{ padding: 8 }}>Ingresos</th><th style={{ padding: 8 }}>Egresos</th><th style={{ padding: 8 }}>Stock</th><th style={{ padding: 8 }}>Historial</th></tr></thead>
                      <tbody>
                        {lineasCompra.map((articulo) => (
                          <tr key={articulo.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                            <td style={{ padding: 8 }}><strong>{articulo.descripcion}</strong><br />{articulo.categoria}</td>
                            <td style={{ padding: 8, color: "#059669" }}>{articulo.ingresos} {articulo.unidad}</td>
                            <td style={{ padding: 8, color: "#B91C1C" }}>{articulo.egresos} {articulo.unidad}</td>
                            <td style={{ padding: 8, fontWeight: 700 }}>{articulo.stock} {articulo.unidad}</td>
                            <td style={{ padding: 8 }}>{articulo.movimientos.map((movimiento) => <div key={`${movimiento.origen}:${movimiento.id}`}>{formatFechaCorta(movimiento.fechaCarga || movimiento.fecha)} · {movimiento.tipo} · {movimiento.cantidad} {movimiento.unidad}</div>)}</td>
                          </tr>
                        ))}
                        {lineasCompra.length === 0 && <tr><td colSpan="5" style={{ padding: 12 }}>No hay movimientos asociados a esta compra.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            );
          })}
          {comprasFiltradas.length === 0 && <div style={{ color: "#6B7280" }}>No hay compras para mostrar.</div>}
        </div>
      </section>

      <section style={caja}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17 }}>Registros históricos pendientes de identificar</h2>
        <p style={{ margin: "0 0 12px", color: "#6B7280", fontSize: 13 }}>Los movimientos originales se conservan. La asignación añade el expediente indicado, pero no inventa una compra ni cambia cantidades.</p>
        <div style={{ display: "grid", gap: 10 }}>
          {movimientosPendientes.map((movimiento) => {
            const key = `${movimiento.origen}:${movimiento.id}`;
            const expedientesDisponibles = expedientes.filter((item) => item.seccion === movimiento.origen);
            return (
              <div key={key} style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: 12, display: "grid", gridTemplateColumns: "minmax(180px,1fr) minmax(180px,1fr) auto", alignItems: "center", gap: 10 }}>
                <div>
                  <strong>{movimiento.descripcion}</strong> · {movimiento.cantidad} {movimiento.unidad}
                  <div style={{ fontSize: 12, color: "#6B7280" }}>{movimiento.tipo} · {movimiento.origen === "nacion" ? "Nación" : "Provincia"} · {movimiento.nroRemito ? `Remito ${movimiento.nroRemito}` : "Sin remito"}</div>
                  {movimiento.numero_expediente && <div style={{ fontSize: 12 }}>Expediente actual: {movimiento.numero_expediente}</div>}
                  {!movimiento.compraId && <div style={{ fontSize: 12, color: "#92400E" }}>Compra no identificada</div>}
                </div>
                <select style={campo} value={expedientesAsignacion[key] || ""} onChange={(event) => setExpedientesAsignacion((actual) => ({ ...actual, [key]: event.target.value }))} disabled={!puedeEscribir}>
                  <option value="">Asignar expediente...</option>
                  {expedientesDisponibles.map((item) => <option key={`${item.seccion}:${item.id}`} value={item.id}>{item.numeroExpediente} — {item.seccion === "nacion" ? "Nación" : "Provincia"}</option>)}
                </select>
                <button type="button" style={{ ...boton, opacity: puedeEscribir && expedientesDisponibles.length ? 1 : 0.5 }} disabled={!puedeEscribir || expedientesDisponibles.length === 0} onClick={() => asignarExpediente(movimiento)}>Asignar</button>
              </div>
            );
          })}
          {movimientosPendientes.length === 0 && <div style={{ color: "#6B7280" }}>No hay registros pendientes.</div>}
        </div>
      </section>
    </div>
  );
}