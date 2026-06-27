export function imprimirRemitoOficial(remito) {
  const ventanaImpresion = window.open("", "_blank");

  // Formatear la fecha prolija
  const fechaFormateada = remito.fecha 
    ? new Date(remito.fecha).toLocaleDateString("es-AR") 
    : new Date().toLocaleDateString("es-AR");

  const tieneFoto = !!remito.foto;

  // Renderizamos el HTML con el SVG lineal oficial y colores de Gobierno
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
          align-items: center;
          border-bottom: 3px solid #0284c7; /* Azul institucional */
          padding-bottom: 20px;
          margin-bottom: 25px;
        }
        .contenedor-identidad {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .logo-container {
          width: 65px;
          height: 65px;
          display: flex;
          align-items: center;
          justify-content: center;
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
          font-size: 18px;
          padding: 4px 14px;
          margin-bottom: 8px;
          text-transform: uppercase;
          border-radius: 4px;
          background: #f0f9ff;
        }
        .info-num-fecha {
          font-size: 13px;
          color: #334155;
        }
        .info-num-fecha strong {
          color: #0f172a;
        }

        /* Grilla de Datos */
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

        /* Zona de Firmas */
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
          page-break-inside: avoid;
        }

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
          <div class="contenedor-identidad">
            <div class="logo-container">
              <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <circle cx="28" cy="28" r="11" fill="#f59e0b"/>
                <path d="M28,12 L28,6 M28,44 L28,50 M12,28 L6,28 M44,28 L50,28 M16.7,16.7 L12.5,12.5 M39.3,39.3 L43.5,43.5 M43.5,12.5 L39.3,16.7 M12.5,43.5 L16.7,39.3" stroke="#f59e0b" stroke-width="3.5" stroke-linecap="round"/>
                
                <path d="M15,68 C35,48 65,48 88,68" fill="none" stroke="#0ea5e9" stroke-width="7.5" stroke-linecap="round"/>
                <path d="M15,77 C35,57 65,57 88,77" fill="none" stroke="#e2e8f0" stroke-width="7.5" stroke-linecap="round"/>
                <path d="M15,86 C35,66 65,66 88,86" fill="none" stroke="#0ea5e9" stroke-width="7.5" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="logos-izq">
              <div class="txt-gobierno">Provincia del Chubut</div>
              <div class="txt-ministerio">Ministerio de Desarrollo Humano</div>
              <div class="txt-subsecretaria">Sistema de Gestión Institucional (SGI)</div>
            </div>
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
        window.onload = function() {
          window.print();
          setTimeout(() => { window.close(); }, 500);
        };
      </script>
    </body>
    </html>
  `;

  ventanaImpresion.document.write(htmlContenido);
  ventanaImpresion.document.close();
}