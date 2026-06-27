export function imprimirRemitoOficial(remito) {
  const ventanaImpresion = window.open("", "_blank");

  // Formatear la fecha prolija
  const fechaFormateada = remito.fecha 
    ? new Date(remito.fecha).toLocaleDateString("es-AR") 
    : new Date().toLocaleDateString("es-AR");

  const tieneFoto = !!remito.foto;

  // Renderizamos el HTML inyectando directamente el SVG del mapa/sol de Chubut
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
          border-bottom: 3px solid #f97316;
          padding-bottom: 20px;
          margin-bottom: 25px;
        }
        .contenedor-identidad {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .logo-container {
          width: 70px;
          height: 55px;
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
          border: 2px solid #f97316;
          color: #e05600;
          font-weight: 700;
          font-size: 18px;
          padding: 4px 14px;
          margin-bottom: 8px;
          text-transform: uppercase;
          border-radius: 4px;
          background: #fff7ed;
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
              <svg viewBox="0 0 106 74" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.6,3.6 C14,-1.2 38.3,0.3 53,0.1 C65,-0.1 79.5,-0.5 91.3,3.7 C94.5,4.8 97.4,7 101,6 C103.3,5.4 105.4,8.5 105.1,11 C104.7,14 101,13.4 99.3,16 C95.6,21.8 100.8,24.8 96.6,31.2 C91,39.8 72,50 78,57 C82.5,62.2 68.6,65 62,69 C51,75.6 37,74.2 25,74 C11,73.8 6.1,65.8 11.2,63 C16,60.4 11,58.7 8.1,57 C3.8,54.4 0,48.5 4,45 C7.5,42 0.3,34.5 2.1,31.2 C5.3,25.4 3,21.5 5,16 C7,10.6 -1.8,6.8 4.6,3.6 Z" fill="#fbb03b"/>
                <path d="M12.4,51 C27,47.5 44,24.5 67,23 C81.5,22 83.1,33.5 96.6,31.2 C91,39.8 72,50 78,57 C82.5,62.2 68.6,65 62,69 C51,75.6 37,74.2 25,74 C15.2,73.8 10,68 11.2,63 C14,56 7.4,52.2 12.4,51 Z" fill="#e77817"/>
                <path d="M11.2,63 C14,56 7.4,52.2 12.4,51 C24,48.2 35.4,56.8 51,55 C65,53.4 72.8,47.8 79,53 C81.4,55 74.2,59.8 72,62 C65.6,68.4 55.4,70 46,73.2 C38,74.2 21.6,74.5 11.2,63 Z" fill="#5894a4"/>
                <path d="M51,55 C65,53.4 72.8,47.8 79,53 C81.4,55 74.2,59.8 72,62 C65,69 53,74.5 41,74 C29,73.5 21,72 11.2,63 C20,62 38,56.2 51,55 Z" fill="#1d657d"/>
                <circle cx="21" cy="22" r="10" fill="#f7931e"/>
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