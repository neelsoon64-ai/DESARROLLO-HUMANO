export function imprimirRemitoOficial(remito) {
  const ventanaImpresion = window.open("", "_blank");

  // Formatear la fecha prolija
  const fechaFormateada = remito.fecha 
    ? new Date(remito.fecha).toLocaleDateString("es-AR") 
    : new Date().toLocaleDateString("es-AR");

  const tieneFoto = !!remito.foto;

  // Renderizamos el HTML con la silueta vectorizada exacta dibujada por código puro
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
          border-bottom: 3px solid #f59e0b; /* Color amarillo/naranja del sol */
          padding-bottom: 20px;
          margin-bottom: 25px;
        }
        .contenedor-identidad {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .logo-container {
          width: 75px;
          height: 60px;
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
          border: 2px solid #f59e0b;
          color: #d97706;
          font-weight: 700;
          font-size: 18px;
          padding: 4px 14px;
          margin-bottom: 8px;
          text-transform: uppercase;
          border-radius: 4px;
          background: #fffbeb;
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
              <svg viewBox="0 0 460 344" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <path d="M 17,25 C 10,40 10,55 24,65 C 32,72 25,85 24,96 C 22,118 36,128 32,150 C 26,170 30,190 24,208 C 17,225 35,228 36,242 C 38,255 17,254 24,270 C 30,285 45,286 42,305 C 40,315 28,318 40,332 C 55,345 100,344 140,344 C 180,344 240,335 270,305 C 290,285 305,270 325,250 C 355,210 350,170 365,120 C 375,90 415,90 435,70 C 455,50 440,25 425,25 C 380,25 100,25 17,25 Z" fill="#ffca18"/>
                
                <circle cx="105" cy="95" r="45" fill="#ffb100"/>
                
                <path d="M 24,150 C 60,110 110,90 170,70 C 240,50 310,90 365,120 C 350,170 355,210 325,250 C 305,270 290,285 270,305 C 240,335 180,344 140,344 C 100,344 55,345 40,332 C 28,318 40,315 42,305 C 45,286 30,285 24,270 C 17,254 38,255 36,242 C 35,228 17,228 24,208 C 30,190 26,170 24,150 Z" fill="#f37023"/>
                
                <path d="M 24,208 C 70,225 140,190 210,180 C 280,170 315,220 340,230 C 328,245 315,260 295,278 C 265,305 210,330 140,344 C 100,344 55,344 40,332 C 28,318 40,315 42,305 C 45,286 30,285 24,270 C 17,254 38,255 36,242 C 35,228 17,228 24,208 Z" fill="#5897b2"/>
                
                <path d="M 36,242 C 80,255 130,240 190,250 C 240,260 270,290 295,278 C 265,305 210,330 140,344 C 100,344 55,344 40,332 C 28,318 40,315 42,305 C 45,286 30,285 24,270 C 17,254 38,255 36,242 Z" fill="#1b667a"/>
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