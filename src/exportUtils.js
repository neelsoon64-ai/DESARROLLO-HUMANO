import * as XLSX from "xlsx";
import { CATEGORIAS, formatFecha, formatFechaCorta } from "./constants.js";

export function exportarExcel(movimientos, seccion, auditoria, usuarioActual, onAudit) {
  const wb = XLSX.utils.book_new();

  const datos = movimientos.map((m) => {
    const cat = CATEGORIAS.find((c) => c.id === m.categoria);
    return {
      "Sección": seccion,
      "Fecha": formatFecha(m.fecha),
      "N° Remito": m.nroRemito || "",
      "Tipo": m.tipo === "ingreso" ? "Ingreso" : "Egreso",
      "Categoría": cat?.label || "",
      "Descripción": m.descripcion,
      "Cantidad": m.cantidad,
      "Unidad": m.unidad,
      "Proveedor": m.proveedor || "",
      "Observaciones": m.observaciones || "",
      "Cargado por": m.cargadoPor || "",
      "Editado por": m.editadoPor || "",
      "Fecha edición": m.fechaEdicion ? formatFecha(m.fechaEdicion) : "",
    };
  });

  const ws = XLSX.utils.json_to_sheet(datos.length ? datos : [{ "Sin datos": "No hay movimientos registrados" }]);
  XLSX.utils.book_append_sheet(wb, ws, `Inventario ${seccion}`);

  if (usuarioActual.rol === "admin" && auditoria.length) {
    const audDatos = auditoria.map((l) => ({ "Fecha": formatFecha(l.fecha), "Usuario": l.usuario, "Rol": l.rol, "Tipo": l.tipo, "Detalle": l.detalle }));
    const wsAud = XLSX.utils.json_to_sheet(audDatos);
    XLSX.utils.book_append_sheet(wb, wsAud, "Auditoría");
  }

  XLSX.writeFile(wb, `Inventario_${seccion}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  onAudit({ tipo: "export", usuario: usuarioActual.nombre, rol: usuarioActual.rol, detalle: `Exportó Excel de ${seccion}` });
}

export function exportarPDF(movimientos, seccion, usuarioActual, onAudit) {
  const cat = (id) => CATEGORIAS.find((c) => c.id === id)?.label || id;
  const fecha = new Date().toLocaleDateString("es-AR");

  const stock = {};
  movimientos.forEach((m) => {
    const k = `${m.categoria}||${m.descripcion}`;
    if (!stock[k]) stock[k] = { cat: cat(m.categoria), desc: m.descripcion, unidad: m.unidad, total: 0 };
    stock[k].total += m.tipo === "ingreso" ? m.cantidad : -m.cantidad;
  });

  const stockRows = Object.values(stock)
    .map(
      (s) =>
        `<tr><td>${s.cat}</td><td>${s.desc}</td><td style="text-align:center;font-weight:700;color:${
          s.total <= 0 ? "#DC2626" : s.total <= 10 ? "#D97706" : "#059669"
        }">${s.total}</td><td style="text-align:center">${s.unidad}</td></tr>`
    )
    .join("");

  const movRows = [...movimientos]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 50)
    .map(
      (m) =>
        `<tr><td>${formatFechaCorta(m.fecha)}</td><td>${m.nroRemito || "—"}</td><td style="color:${
          m.tipo === "ingreso" ? "#059669" : "#DC2626"
        };font-weight:600">${m.tipo === "ingreso" ? "▲ Ingreso" : "▼ Egreso"}</td><td>${cat(m.categoria)}</td><td>${m.descripcion}</td><td style="text-align:center;font-weight:700">${m.cantidad} ${m.unidad}</td><td>${m.cargadoPor || "—"}</td></tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Inventario ${seccion}</title>
  <style>
    body{font-family:Arial,sans-serif;color:#1E293B;margin:0;padding:24px;font-size:12px}
    .header{background:linear-gradient(135deg,#1A3A5C,#2E7DC4);color:#fff;padding:20px 24px;border-radius:8px;margin-bottom:20px}
    .header h1{margin:0;font-size:20px}.header p{margin:4px 0 0;opacity:.8;font-size:12px}
    .badge{display:inline-block;background:#C8993A;color:#fff;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;margin-left:8px}
    h2{color:#1A3A5C;font-size:14px;border-bottom:2px solid #E2E8F0;padding-bottom:6px;margin-top:22px}
    table{width:100%;border-collapse:collapse;margin-top:8px}
    th{background:#1A3A5C;color:#fff;padding:7px 8px;text-align:left;font-size:11px}
    td{padding:6px 8px;border-bottom:1px solid #F1F5F9;font-size:11px}
    tr:nth-child(even) td{background:#F8FAFC}
    .footer{margin-top:24px;color:#94A3B8;font-size:10px;text-align:center;border-top:1px solid #E2E8F0;padding-top:10px}
  </style></head><body>
  <div class="header"><h1>Ministerio de Desarrollo Humano <span class="badge">${seccion}</span></h1>
  <p>Reporte de Inventario · Generado el ${fecha} por ${usuarioActual.nombre}</p></div>
  <h2>📊 Stock Actual</h2>
  <table><thead><tr><th>Categoría</th><th>Descripción</th><th>Stock</th><th>Unidad</th></tr></thead><tbody>${
    stockRows || "<tr><td colspan='4'>Sin datos</td></tr>"
  }</tbody></table>
  <h2>📋 Historial de Movimientos (últimos 50)</h2>
  <table><thead><tr><th>Fecha</th><th>Remito</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th>Cantidad</th><th>Operador</th></tr></thead><tbody>${
    movRows || "<tr><td colspan='7'>Sin datos</td></tr>"
  }</tbody></table>
  <div class="footer">Sistema de Inventario · Ministerio de Desarrollo Humano · ${fecha}</div>
  </body></html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 400);
  onAudit({ tipo: "export", usuario: usuarioActual.nombre, rol: usuarioActual.rol, detalle: `Exportó PDF de ${seccion}` });
}
