import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import logo from './assets/logo.png'; // Asegúrate que la ruta al logo es correcta

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
      new Date(m.fechaCarga || m.fecha).toLocaleDateString('es-AR'),
      m.tipo,
      m.descripcion,
      m.categoria,
      `${m.cantidad} ${m.unidad}`,
      m.cargadoPor,
      m.numero_expediente || m.nroRemito || 'N/A'
    ]);

    doc.autoTable({
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