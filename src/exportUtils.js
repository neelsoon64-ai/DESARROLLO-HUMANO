import * as XLSX from "xlsx";
import { CATEGORIAS, formatFecha, formatFechaCorta } from "./constants.js";
import logo from "./assets/logo.png";

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

  if (usuarioActual.rol === "Administrador" && auditoria.length) {
    const audDatos = auditoria.map((l) => ({ "Fecha": formatFecha(l.fecha), "Usuario": l.usuario, "Rol": l.rol, "Tipo": l.tipo, "Detalle": l.detalle }));
    const wsAud = XLSX.utils.json_to_sheet(audDatos);
    XLSX.utils.book_append_sheet(wb, wsAud, "Auditoría");
  }

  XLSX.writeFile(wb, `Inventario_${seccion}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  onAudit({ tipo: "export", usuario: usuarioActual.nombre, rol: usuarioActual.rol, detalle: `Exportó Excel de ${seccion}` });
}

export function exportarPDF(movimientos, seccion, usuarioActual, onAudit) {
  const getCategoriaLabel = (id) => CATEGORIAS.find((c) => c.id === id)?.label || id || "General";
  const fecha = new Date().toLocaleDateString("es-AR");

  const stock = {};
  movimientos.forEach((m) => {
    const k = `${m.categoria}||${m.descripcion}`;
    if (!stock[k]) stock[k] = { cat: cat(m.categoria), desc: m.descripcion, unidad: m.unidad, total: 0 };
    stock[k].total += m.tipo === "ingreso" ? m.cantidad : -m.cantidad;
  });  const cat = (id) => CATEGORIAS.find((c) => c.id === id)?.label || id;

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
        };font-weight:600">${m.tipo === "ingreso" ? "▲ Ingreso" : "▼ Egreso"}</td><td>${getCategoriaLabel(m.categoria)}</td><td>${m.descripcion}</td><td style="text-align:center;font-weight:700">${m.cantidad} ${m.unidad}</td><td>${m.cargadoPor || "—"}</td></tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Inventario ${seccion}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    html, body { width: 100%; margin: 0; padding: 0; background: #F8FAFC; }
    body { font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1E293B; padding: 0; }
    .page { width: 100%; max-width: 1200px; margin: 0 auto; background: #FFFFFF; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; border-bottom: 2px solid #E2E8F0; padding-bottom: 18px; margin-bottom: 20px; }
    .header-left { display: flex; gap: 18px; align-items: center; }
    .logo-container { width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; }
    .logo-container img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .header-text h1 { margin: 0; font-size: 22px; line-height: 1.1; color: #0F172A; }
    .header-text p { margin: 4px 0 0; color: #475569; font-size: 13px; }
    .header-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; min-width: 280px; }
    .meta-card { background: #F8FAFC; padding: 10px 14px; border-radius: 12px; border: 1px solid #E2E8F0; color: #0F172A; font-size: 12px; }
    .meta-card strong { display: block; font-size: 16px; margin-bottom: 2px; color: #1E293B; }
    .section-title { margin: 24px 0 12px; color: #0F172A; font-size: 16px; font-weight: 700; letter-spacing: 0.3px; border-bottom: 1px solid #CBD5E1; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; page-break-inside: auto; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    thead { display: table-header-group; }
    th, td { padding: 9px 12px; border-bottom: 1px solid #E2E8F0; font-size: 11px; text-align: left; }
    th { background: #F1F5F9; color: #475569; text-transform: uppercase; font-size: 10px; font-weight: 600; }
    tbody tr:nth-child(even) { background: #F8FAFC; }
    .footer {
      position: fixed; bottom: 10mm; left: 18mm; right: 18mm;
      display: flex; justify-content: space-between; align-items: center;
      font-size: 10px; color: #64748B;
    }
    .footer .page-number::after { content: counter(page) ' de ' counter(pages); }
    .status-positive { color: #047857; font-weight: 700; }
    .status-warning { color: #B45309; font-weight: 700; }
    .status-negative { color: #B91C1C; font-weight: 700; }
    @media print {
      body { padding: 0; background: #FFF; counter-reset: page; }
      .page { box-shadow: none; border-radius: 0; margin: 0; padding: 0; }
      .header-meta, .meta-card { page-break-inside: avoid; }
      body * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style></head><body>
  <div class="page">
    <div class="header">
      <div class="header-left">
        <div class="logo-container">
          <img src="${logo}" alt="Logo MDH" />
        </div>
        <div class="header-text">
          <p style="margin:0;color:#64748B;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;">Gobierno de la Provincia del Chubut</p>
          <h1 style="margin:4px 0 0;">Ministerio de Desarrollo Humano</h1>
          <p style="margin:8px 0 0;">Reporte de Inventario: <strong>${seccion}</strong></p>
        </div>
      </div>
      <div class="header-meta">
        <div class="meta-card"><strong>${fecha}</strong> Fecha de Emisión</div>
        <div class="meta-card"><strong>${usuarioActual.nombre}</strong> Emitido por</div>
        <div class="meta-card"><strong>${Object.values(stock).length}</strong> Líneas de stock</div>
        <div class="meta-card"><strong>${movimientos.length}</strong> Movimientos totales</div>
      </div>
    </div>

    <h2 class="section-title">Stock Actual</h2>
    <table><thead><tr><th>Categoría</th><th>Descripción</th><th>Stock total</th><th>Unidad</th></tr></thead><tbody>${
      stockRows || "<tr><td colspan='4' style='text-align:center;color:#475569;padding:16px 0;'>Sin datos</td></tr>"
    }</tbody></table>

    <h2 class="section-title">Historial de Movimientos (últimos 50)</h2>
    <table><thead><tr><th>Fecha</th><th>Remito</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th>Cantidad</th><th>Operador</th></tr></thead><tbody>${
      movRows || "<tr><td colspan='7' style='text-align:center;color:#475569;padding:16px 0;'>Sin datos</td></tr>"
    }</tbody></table>

    <div class="footer">
      <span>Sistema de Inventario MDH · Ministerio de Desarrollo Humano</span>
      <span class="page-number"></span>
    </div>
  </div>
  </body></html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 400);
  if (typeof onAudit === "function") {
    onAudit({ tipo: "export", usuario: usuarioActual.nombre, rol: usuarioActual.rol, detalle: `Exportó PDF de ${seccion}` });
  }
}

export function exportarRespaldoExcel(copia, usuarioActual = { nombre: "Sistema", rol: "sistema" }, onAudit) {
  const wb = XLSX.utils.book_new();
  const fechaHoy = new Date().toISOString().slice(0, 10);

  const safeMovimientos = (movs) => Array.isArray(movs) ? movs.filter(Boolean) : Object.values(movs || {}).filter(Boolean);
  const nacionMovs = safeMovimientos(copia.nacion?.movimientos);
  const provinciaMovs = safeMovimientos(copia.provincia?.movimientos);
  const usuarios = Array.isArray(copia.usuarios) ? copia.usuarios.filter(Boolean) : [];
  const auditoria = Array.isArray(copia.auditoria) ? copia.auditoria.filter(Boolean) : [];

  const crearSheet = (registros, nombreHoja) => {
    if (registros.length === 0) {
      return XLSX.utils.json_to_sheet([{ "Sin datos": "No hay registros" }]);
    }
    return XLSX.utils.json_to_sheet(registros);
  };

  wb.SheetNames.push("Resumen");
  wb.Sheets["Resumen"] = XLSX.utils.json_to_sheet([
    { Campo: "Sección Nación - Movimientos", Valor: nacionMovs.length },
    { Campo: "Sección Provincia - Movimientos", Valor: provinciaMovs.length },
    { Campo: "Usuarios", Valor: usuarios.length },
    { Campo: "Auditoría", Valor: auditoria.length },
  ]);

  wb.SheetNames.push("Nación");
  wb.Sheets["Nación"] = crearSheet(nacionMovs.map((m) => ({
    id: m.id || "",
    descripcion: m.descripcion || "",
    categoria: m.categoria || "",
    cantidad: m.cantidad ?? "",
    unidad: m.unidad || "",
    nroRemito: m.nroRemito || "",
    fecha: m.fecha || "",
    fechaCarga: m.fechaCarga || "",
    proveedor: m.proveedor || "",
    observaciones: m.observaciones || "",
    tipo: m.tipo || "",
    foto: m.foto || "",
    cargadoPor: m.cargadoPor || "",
    editadoPor: m.editadoPor || "",
  })));

  wb.SheetNames.push("Provincia");
  wb.Sheets["Provincia"] = crearSheet(provinciaMovs.map((m) => ({
    id: m.id || "",
    descripcion: m.descripcion || "",
    categoria: m.categoria || "",
    cantidad: m.cantidad ?? "",
    unidad: m.unidad || "",
    nroRemito: m.nroRemito || "",
    fecha: m.fecha || "",
    fechaCarga: m.fechaCarga || "",
    proveedor: m.proveedor || "",
    observaciones: m.observaciones || "",
    tipo: m.tipo || "",
    foto: m.foto || "",
    cargadoPor: m.cargadoPor || "",
    editadoPor: m.editadoPor || "",
  })));

  wb.SheetNames.push("Usuarios");
  wb.Sheets["Usuarios"] = crearSheet(usuarios.map((u) => ({
    id: u.id || "",
    nombre: u.nombre || "",
    rol: u.rol || "",
    email: u.email || "",
    telefono: u.telefono || "",
  })));

  wb.SheetNames.push("Auditoría");
  wb.Sheets["Auditoría"] = crearSheet(auditoria.map((log) => ({
    fecha: log.fecha || "",
    usuario: log.usuario || "",
    rol: log.rol || "",
    tipo: log.tipo || "",
    detalle: log.detalle || "",
  })));

  XLSX.writeFile(wb, `Respaldo_Inventario_${fechaHoy}.xlsx`);
  if (typeof onAudit === "function") {
    onAudit({ tipo: "export", usuario: usuarioActual.nombre, rol: usuarioActual.rol, detalle: "Exportó respaldo a Excel" });
  }
}

export function exportarRespaldoPDF(copia, usuarioActual = { nombre: "Sistema", rol: "sistema" }, onAudit) {
  const fecha = new Date().toLocaleDateString("es-AR");
  const nacionMovs = Array.isArray(copia.nacion?.movimientos) ? copia.nacion.movimientos.filter(Boolean) : Object.values(copia.nacion?.movimientos || {}).filter(Boolean);
  const provinciaMovs = Array.isArray(copia.provincia?.movimientos) ? copia.provincia.movimientos.filter(Boolean) : Object.values(copia.provincia?.movimientos || {}).filter(Boolean);
  const usuarios = Array.isArray(copia.usuarios) ? copia.usuarios.filter(Boolean) : [];
  const auditoria = Array.isArray(copia.auditoria) ? copia.auditoria.filter(Boolean) : [];
  const totalMovs = nacionMovs.length + provinciaMovs.length;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Respaldo Inventario</title>
  <style>
    body{font-family:Arial,sans-serif;color:#1E293B;margin:0;padding:24px;font-size:12px}
    .header{padding-bottom:20px;border-bottom:2px solid #E2E8F0;margin-bottom:20px}
    .header h1{margin:0;font-size:20px}
    .summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:16px}
    .card{background:#F8FAFC;padding:14px;border-radius:12px;box-shadow:0 2px 10px rgba(15,23,42,0.06)}
    .card strong{display:block;font-size:18px;margin-bottom:4px;color:#0F172A}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th,td{padding:8px;border:1px solid #E2E8F0;text-align:left;font-size:11px}
    th{background:#1A3A5C;color:#fff}
    .footer{margin-top:20px;color:#64748B;font-size:10px;text-align:center}
  </style></head><body>
  <div class="header"><h1>Respaldo de Inventario</h1><p>Generado el ${fecha} por ${usuarioActual.nombre}</p></div>
  <div class="summary">
    <div class="card"><strong>${totalMovs}</strong>Movimientos totales</div>
    <div class="card"><strong>${nacionMovs.length}</strong>Movimientos Nación</div>
    <div class="card"><strong>${provinciaMovs.length}</strong>Movimientos Provincia</div>
    <div class="card"><strong>${usuarios.length}</strong>Usuarios</div>
    <div class="card"><strong>${auditoria.length}</strong>Registros de auditoría</div>
  </div>
  <h2>Movimientos recientes (Nación)</h2>
  <table><thead><tr><th>Fecha</th><th>Remito</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th>Cantidad</th></tr></thead><tbody>${nacionMovs.slice(0, 10).map(m => `<tr><td>${m.fecha || ""}</td><td>${m.nroRemito || ""}</td><td>${m.tipo || ""}</td><td>${m.categoria || ""}</td><td>${m.descripcion || ""}</td><td>${m.cantidad ?? ""}</td></tr>`).join("") || '<tr><td colspan="6">Sin datos</td></tr>'}</tbody></table>
  <h2>Movimientos recientes (Provincia)</h2>
  <table><thead><tr><th>Fecha</th><th>Remito</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th>Cantidad</th></tr></thead><tbody>${provinciaMovs.slice(0, 10).map(m => `<tr><td>${m.fecha || ""}</td><td>${m.nroRemito || ""}</td><td>${m.tipo || ""}</td><td>${m.categoria || ""}</td><td>${m.descripcion || ""}</td><td>${m.cantidad ?? ""}</td></tr>`).join("") || '<tr><td colspan="6">Sin datos</td></tr>'}</tbody></table>
  <div class="footer">Inventario - Ministerio de Desarrollo Humano</div>
  </body></html>`;

  const win = window.open("", "_blank");
  if (!win) {
    window.alert("No se pudo abrir la ventana para generar el PDF. Revisa el bloqueador de ventanas emergentes.");
    return;
  }
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 400);
  if (typeof onAudit === "function") {
    onAudit({ tipo: "export", usuario: usuarioActual.nombre, rol: usuarioActual.rol, detalle: "Exportó respaldo a PDF" });
  }
}
