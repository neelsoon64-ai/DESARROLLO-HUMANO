import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import logo from '../assets/logo.png';

import { formatFechaCorta, formatFechaHora } from '../constants';
/**
 * Generador de Informes Profesionales (PDF y Excel)
 * Inspirado en sistemas ERP para calidad institucional.
 */

const COLORES_INSTITUCIONALES = {
  primario: '#1A3A5C', // Azul oscuro
  secundario: '#2E7DC4', // Azul claro
  acento: '#C8993A', // Dorado
  textoPrincipal: '#1E293B',
  textoSecundario: '#475569',
  bordeTabla: '#E2E8F0',
};

// =================================================================================
//  функції REUTILIZABLES PARA PDF
// =================================================================================

const agregarEncabezadoPDF = (doc, titulo, usuario) => {
  const fechaHora = new Date().toLocaleString('es-AR');
  
  doc.addImage(logo, 'PNG', 15, 12, 20, 16);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORES_INSTITUCIONALES.primario);
  doc.text('Ministerio de Desarrollo Humano', 40, 18);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORES_INSTITUCIONALES.textoSecundario);
  doc.text('Sistema de Gestión de Inventario (SGI)', 40, 24);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORES_INSTITUCIONALES.textoPrincipal);
  doc.text(titulo, doc.internal.pageSize.getWidth() / 2, 38, { align: 'center' });

  doc.setDrawColor(COLORES_INSTITUCIONALES.bordeTabla);
  doc.line(15, 45, doc.internal.pageSize.getWidth() - 15, 45);
};

const agregarPieDePaginaPDF = (doc, usuario) => {
  const pageCount = doc.internal.getNumberOfPages();
  const fechaHora = new Date().toLocaleString('es-AR');

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(8);
    doc.setTextColor(COLORES_INSTITUCIONALES.textoSecundario);

    const textoPie = `Generado por: ${usuario.nombre} | ${fechaHora} | Documento de uso interno`;
    doc.text(textoPie, 15, pageHeight - 10);

    const textoPagina = `Página ${i} de ${pageCount}`;
    doc.text(textoPagina, pageWidth - 15, pageHeight - 10, { align: 'right' });
  }
};

// =================================================================================
// EXPORTACIÓN A PDF
// =================================================================================

export const exportarHistorialPDF = async (movimientos, usuario) => {
  return new Promise((resolve) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const titulo = 'Reporte de Historial de Movimientos';
    agregarEncabezadoPDF(doc, titulo, usuario);

    const totalMovimientos = movimientos.length;
    const totalIngresos = movimientos.filter(m => m.tipo === 'ingreso').length;
    const totalEgresos = movimientos.filter(m => m.tipo === 'egreso').length;

    let resumenY = 55;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen Ejecutivo:', 15, resumenY);
    resumenY += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`- Total de Movimientos: ${totalMovimientos}`, 20, resumenY);
    doc.text(`- Total Ingresos: ${totalIngresos}`, 90, resumenY);
    doc.text(`- Total Egresos: ${totalEgresos}`, 160, resumenY);

    const head = [['Fecha', 'Tipo', 'Artículo', 'Categoría', 'Cantidad', 'Usuario', 'Remito/Exp.']];
    const body = movimientos.map(m => [
      formatFechaCorta(m.fechaCarga || m.fecha),
      m.tipo,
      m.descripcion,
      m.categoria,
      `${m.cantidad} ${m.unidad}`,
      m.cargadoPor,
      m.numero_expediente || m.nroRemito || 'N/A'
    ]);

    autoTable(doc, {
      startY: resumenY + 10,
      head: head,
      body: body,
      theme: 'grid',
      headStyles: {
        fillColor: COLORES_INSTITUCIONALES.primario,
        textColor: '#FFFFFF',
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      alternateRowStyles: {
        fillColor: '#F8FAFC',
      },
    });

    agregarPieDePaginaPDF(doc, usuario);

    doc.save(`Reporte_Historial_${new Date().toISOString().slice(0, 10)}.pdf`);
    resolve();
  });
};

export const exportarDetalleRegistroPDF = (registro, movimientos, usuario) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const valor = (dato) => dato || "—";
  const destinatario = (movimiento) => {
    const persona = [movimiento.nombre_destinatario, movimiento.apellido_destinatario].filter(Boolean).join(" ");
    return [
      persona || movimiento.destinatario || "—",
      movimiento.dni_destinatario ? `DNI: ${movimiento.dni_destinatario}` : "",
      movimiento.destinatario && persona ? movimiento.destinatario : "",
      [movimiento.direccion, movimiento.localidad].filter(Boolean).join(", "),
    ].filter(Boolean).join("\n");
  };

  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("Detalle de inventario y movimientos", 14, 15);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Artículo: ${registro.descripcion || "—"} | Categoría: ${registro.categoria || "—"}`, 14, 22);
  doc.text(`Expediente: ${valor(registro.numero_expediente)} | Compra: ${registro.orden_compra || registro.compraId || "No identificada"} | Remito: ${valor(registro.nroRemito)}`, 14, 28);
  doc.text(`Ingresos: ${registro.ingresos} ${registro.unidad} | Egresos: ${registro.egresos} ${registro.unidad} | Stock: ${registro.stock} ${registro.unidad}`, 14, 34);
  doc.text(`Generado por: ${usuario?.nombre || "Sistema"} | ${new Date().toLocaleString("es-AR")}`, 14, 40);

  autoTable(doc, {
    startY: 45,
    head: [["Fecha y hora", "Tipo", "Artículo", "Cantidad", "Stock resultante", "Retiró / destinatario", "Operario", "Remito / expediente", "Observaciones"]],
    body: movimientos.map((movimiento) => [
      formatFechaHora(movimiento.fechaCarga || movimiento.fecha),
      movimiento.tipo || "—",
      movimiento.descripcion || registro.descripcion || "—",
      `${movimiento.cantidad} ${movimiento.unidad || registro.unidad}`,
      movimiento.stockResultante === null ? "No calculable" : `${movimiento.stockResultante} ${movimiento.unidad || registro.unidad}`,
      destinatario(movimiento),
      movimiento.cargadoPor || "—",
      [movimiento.nroRemito, movimiento.numero_expediente ? `Exp. ${movimiento.numero_expediente}` : ""].filter(Boolean).join("\n") || "—",
      movimiento.observaciones || movimiento.motivo || "—",
    ]),
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [26, 58, 92], textColor: 255 },
    didDrawPage: () => {
      const page = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.text(`Página ${page}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 7, { align: "right" });
    },
  });

  const identificador = registro.orden_compra || registro.compraId || registro.stockKey || "historico";
  doc.save(`Detalle_${String(identificador).replace(/[^a-zA-Z0-9_-]/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const exportarDetalleRegistroExcel = async (registro, movimientos, usuario) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistema de Gestión de Inventario (SGI)";
  workbook.lastModifiedBy = usuario?.nombre || "Sistema";

  const resumen = workbook.addWorksheet("Detalle");
  resumen.addRows([
    ["Detalle de inventario"],
    ["Artículo", registro.descripcion || "—"],
    ["Categoría", registro.categoria || "—"],
    ["Expediente", registro.numero_expediente || "—"],
    ["Compra", registro.orden_compra || registro.compraId || "No identificada"],
    ["Remito", registro.nroRemito || "—"],
    ["Fecha de compra", registro.fechaCompra || "—"],
    ["Ingresos", `${registro.ingresos} ${registro.unidad}`],
    ["Egresos", `${registro.egresos} ${registro.unidad}`],
    ["Stock disponible", `${registro.stock} ${registro.unidad}`],
    ["Generado por", usuario?.nombre || "Sistema"],
    ["Fecha de generación", new Date().toLocaleString("es-AR")],
  ]);
  resumen.getRow(1).font = { bold: true, size: 16, color: { argb: "FF1A3A5C" } };
  resumen.getColumn(1).width = 24;
  resumen.getColumn(2).width = 48;

  const historial = workbook.addWorksheet("Movimientos");
  historial.columns = [
    { header: "Fecha y hora", key: "fecha", width: 22 },
    { header: "Tipo", key: "tipo", width: 14 },
    { header: "Artículo", key: "descripcion", width: 40 },
    { header: "Categoría", key: "categoria", width: 24 },
    { header: "Cantidad", key: "cantidad", width: 16 },
    { header: "Stock resultante", key: "stockResultante", width: 19 },
    { header: "Persona que retiró", key: "persona", width: 28 },
    { header: "DNI", key: "dni", width: 16 },
    { header: "Institución / destinatario", key: "destinatario", width: 30 },
    { header: "Dirección", key: "direccion", width: 30 },
    { header: "Localidad", key: "localidad", width: 20 },
    { header: "Operario / usuario", key: "usuario", width: 24 },
    { header: "Remito / comprobante", key: "remito", width: 24 },
    { header: "Expediente", key: "expediente", width: 22 },
    { header: "Observaciones", key: "observaciones", width: 40 },
  ];
  historial.addRows(movimientos.map((movimiento) => ({
    fecha: formatFechaHora(movimiento.fechaCarga || movimiento.fecha),
    tipo: movimiento.tipo || "—",
    descripcion: movimiento.descripcion || registro.descripcion || "—",
    categoria: movimiento.categoria || registro.categoria || "—",
    cantidad: `${movimiento.cantidad} ${movimiento.unidad || registro.unidad}`,
    stockResultante: movimiento.stockResultante === null ? "No calculable" : `${movimiento.stockResultante} ${movimiento.unidad || registro.unidad}`,
    persona: [movimiento.nombre_destinatario, movimiento.apellido_destinatario].filter(Boolean).join(" ") || movimiento.destinatario || "—",
    dni: movimiento.dni_destinatario || "—",
    destinatario: movimiento.destinatario || "—",
    direccion: movimiento.direccion || "—",
    localidad: movimiento.localidad || "—",
    usuario: movimiento.cargadoPor || "—",
    remito: movimiento.nroRemito || movimiento.comprobante || "—",
    expediente: movimiento.numero_expediente || "—",
    observaciones: movimiento.observaciones || movimiento.motivo || "—",
  })));
  historial.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  historial.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A3A5C" } };
  historial.autoFilter = { from: "A1", to: "O1" };
  historial.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const identificador = registro.orden_compra || registro.compraId || registro.stockKey || "historico";
  link.href = url;
  link.download = `Detalle_${String(identificador).replace(/[^a-zA-Z0-9_-]/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// =================================================================================
// EXPORTACIÓN A EXCEL
// =================================================================================

export const exportarRespaldoCompletoExcel = async (datos, usuario) => {
  return new Promise(async (resolve) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Gestión de Inventario (SGI)';
    workbook.lastModifiedBy = usuario.nombre;
    workbook.created = new Date();
    workbook.modified = new Date();

    // --- Hoja de Resumen ---
    const resumenSheet = workbook.addWorksheet('Resumen Ejecutivo');
    resumenSheet.addRow(['Reporte de Inventario Completo']);
    resumenSheet.addRow(['Generado por:', usuario.nombre]);
    resumenSheet.addRow(['Fecha:', new Date().toLocaleString('es-AR')]);
    resumenSheet.mergeCells('A1:D1');
    resumenSheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF1A3A5C' } };

    // --- Hoja de Inventario (Stock) ---
    const stockSheet = workbook.addWorksheet('Inventario (Stock)');
    stockSheet.columns = [
      { header: 'Categoría', key: 'categoria', width: 25 },
      { header: 'Descripción', key: 'descripcion', width: 40 },
      { header: 'Stock Actual', key: 'stock', width: 15, style: { numFmt: '#,##0' } },
      { header: 'Unidad', key: 'unidad', width: 15 },
    ];
    stockSheet.addRows(datos.stock);
    stockSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    stockSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3A5C' } };
    stockSheet.autoFilter = 'A1:D1';

    // --- Hoja de Movimientos (Historial) ---
    const historialSheet = workbook.addWorksheet('Historial de Movimientos');
    historialSheet.columns = [
        { header: 'Fecha', key: 'fecha', width: 15 },
        { header: 'Tipo', key: 'tipo', width: 12 },
        { header: 'Origen', key: 'origen', width: 12 },
        { header: 'Artículo', key: 'descripcion', width: 40 },
        { header: 'Categoría', key: 'categoria', width: 25 },
        { header: 'Cantidad', key: 'cantidad', width: 15, style: { numFmt: '#,##0' } },
        { header: 'Unidad', key: 'unidad', width: 15 },
        { header: 'Usuario', key: 'cargadoPor', width: 20 },
        { header: 'Remito', key: 'nroRemito', width: 20 },
        { header: 'Expediente', key: 'numero_expediente', width: 20 },
    ];
    const todosLosMovimientos = [...datos.nacion, ...datos.provincia].map(m => ({
        ...m,
        fecha: new Date(m.fechaCarga || m.fecha),
    }));
    historialSheet.addRows(todosLosMovimientos);
    historialSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    historialSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D714C' } }; // Verde para historial
    historialSheet.autoFilter = 'A1:J1';

    // --- Hoja de Auditoría ---
    if (datos.auditoria && (usuario.rol === 'Administrador' || usuario.rol === 'Auditor')) {
        const auditoriaSheet = workbook.addWorksheet('Auditoría');
        auditoriaSheet.columns = [
            { header: 'Fecha', key: 'fecha', width: 20 },
            { header: 'Usuario', key: 'usuario', width: 25 },
            { header: 'Rol', key: 'rol', width: 15 },
            { header: 'Tipo', key: 'tipo', width: 15 },
            { header: 'Detalle', key: 'detalle', width: 60 },
        ];
        auditoriaSheet.addRows(datos.auditoria.map(a => ({...a, fecha: new Date(a.fecha)})));
        auditoriaSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        auditoriaSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8993A' } }; // Dorado para auditoría
        auditoriaSheet.autoFilter = 'A1:E1';
    }

    // Generar y descargar el archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_Completo_SGI_${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);

    resolve();
  });
};