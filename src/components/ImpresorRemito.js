export function imprimirRemitoOficial(remito) {
  const ventanaImpresion = window.open("", "_blank");

  // Formatear la fecha prolija
  const fechaFormateada = remito.fecha 
    ? new Date(remito.fecha).toLocaleDateString("es-AR") 
    : new Date().toLocaleDateString("es-AR");

  // Si el remito guardó múltiples fotos o una sola, lo normalizamos para mostrar links si hiciera falta
  const tieneFoto = !!remito.foto;

  // Renderizamos el HTML con estilos CSS embebidos optimizados para hojas A4
  const htmlContenido = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Remito Oficial - MDH Chubut</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Inter', sans-serif;
          color: #1e293b;
          background-color: #fff;
          padding: 40px;
          font-size: 13px;
          line-height: 1.5;
        }
        
        /* Contenedor del documento */
        .documento-remito {
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #cbd5e1;
          padding: 30px;
          position: relative;
          background: #fff;
        }

        /* Membrete Institucional */
        .header-ministerio {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #0284c7; /* Azul institucional */
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .logos-izq {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .txt-gobierno {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #64748b;
        }
        .txt-ministerio {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 2px;
        }
        .txt-subsecretaria {
          font-size: 12px;
          color: #334155;
        }
        
        /* Cuadrante Derecho: Info del Comprobante */
        .comprobante-der {
          text-align: right;
        }
        .tipo-comprobante {
          display: inline-block;
          border: 2px solid #0284c7;
          color: #0284c7;
          font-weight: 700;
          font-size: 20px;
          padding: 5px 15px;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .info-num-fecha {
          font-size: 13px;
          color: #334155;
        }
        .info-num-fecha strong {
          color: #0f172a;
        }

        /* Grilla de Datos de Origen / Destino */
        .seccion-detalles {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
          background: #f8fafc;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
        .bloque-dato p {
          margin-bottom: 6px;
        }
        .bloque-dato strong {
          color: #475569;
        }

        /* Tabla de Artículos */
        .tabla-materiales {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .tabla-materiales th {
          background-color: #0f172a;
          color: #ffffff;
          font-weight: 600;
          text-align: left;
          padding: 10px 12px;
          font-size: 12px;
          text-transform: uppercase;
        }
        .tabla-materiales td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
        }
        .tabla-materiales tr:nth-child(even) {
          background-color: #f8fafc;
        }
        
        /* Observaciones */
        .observaciones-contenedor {
          border: 1px dashed #cbd5e1;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 60px;
          background: #fafafa;
        }
        .observaciones-titulo {
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 5px;
        }

        /* Zona de Firmas al pie de página */
        .seccion-firmas {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          margin-top: 50px;
          padding: 0 20px;
        }
        .bloque-firma {
          text-align: center;
          border-top: 1px solid #94a3b8;
          padding-top: 8px;
          font-size: 12px;
          color: #475569;
        }

        /* Forzado de reglas específicas para cuando se genera el PDF real */
        @media print {
          body {
            padding: 0;
          }
          .documento-remito {
            border: none;
            padding: 0;
            max-width: 100%;
          }
          .tabla-materiales th {
            background-color: #0f172a !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .seccion-detalles {
            background: #f8fafc !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>

      <div class="documento-remito">
        
        <div class="header-ministerio">
          <div class="logos-izq">
            <div class="txt-gobierno">Provincia del Chubut</div>
            <div class="txt-ministerio">Ministerio de Desarrollo Humano</div>
            <div class="txt-subsecretaria">Sistema de Gestión Institucional (SGI)</div>
          </div>
          <div class="comprobante-der">
            <div class="tipo-comprobante">${remito.tipo === "ingreso" ? "Ingreso" : remito.tipo === "egreso" ? "Egreso" : "S. Inicial"}</div>
            <div class="info-num-fecha">
              <p><strong>Fecha:</strong> ${fechaFormateada}</p>
              <p><strong>N° Comprobante:</strong> ${remito.nroRemito || "S/N"}</p>
            </div>
          </div>
        </div>

        <div class="seccion-detalles">
          <div class="bloque-dato">
            <p><strong>Concepto / Tipo:</strong> ${remito.tipo?.toUpperCase()}</p>
            <p><strong>Categoría:</strong> ${remito.categoria || "General"}</p>
          </div>
          <div class="bloque-dato">
            <p><strong>Ubicación / Procedencia:</strong> ${remito.proveedor || "No especificado"}</p>
            <p><strong>ID Interno Movimiento:</strong> #${remito.id}</p>
          </div>
        </div>

        <table class="tabla-materiales">
          <thead>
            <tr>
              <th style="width: 65%;">Descripción del Artículo / Material</th>
              <th style="width: 15%; text-align: center;">Cantidad</th>
              <th style="width: 20%; text-align: center;">Unidad</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${remito.descripcion || "Sin descripción"}</td>
              <td style="text-align: center; font-weight: 700;">${remito.cantidad || "0"}</td>
              <td style="text-align: center; color: #64748b;">${remito.unidad || "unidades"}</td>
            </tr>
          </tbody>
        </table>

        <div class="observaciones-contenedor">
          <div class="observaciones-titulo">Observaciones / Notas de Carga</div>
          <div>${remito.observaciones?.trim() || "Sin observaciones adicionales registradas en este movimiento institucional."}</div>
          ${tieneFoto ? `<div style="margin-top: 10px; font-size: 11px; color: #0284c7; font-weight: 600;">📎 El remito físico cuenta con respaldo fotográfico digital en la base de datos central.</div>` : ""}
        </div>

        <div class="seccion-firmas">
          <div class="bloque-firma">
            <strong>Firma y Aclaración Responsable</strong><br>
            Personal de Carga / Depósito MDH
          </div>
          <div class="bloque-firma">
            <strong>Firma Autorizada / Recepción</strong><br>
            Área de Suministros / Coordinación institucional
          </div>
        </div>

      </div>

      <script>
        // Dispara la ventana de guardado/impresión de forma automática al renderizar
        window.onload = function() {
          window.print();
          // Opcional: cierra la pestaña secundaria automáticamente después de imprimir/cancelar
          setTimeout(() => { window.close(); }, 500);
        };
      </script>
    </body>
    </html>
  `;

  // Insertamos el HTML estructurado y cerramos el flujo de renderizado del documento
  ventanaImpresion.document.write(htmlContenido);
  ventanaImpresion.document.close();
}