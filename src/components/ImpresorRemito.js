export function imprimirRemitoOficial(remito) {
  const ventanaImpresion = window.open("", "_blank");

  // Formatear la fecha prolija
  const fechaFormateada = remito.fecha 
    ? new Date(remito.fecha).toLocaleDateString("es-AR") 
    : new Date().toLocaleDateString("es-AR");

  const tieneFoto = !!remito.foto;

  // 🏔️ Logo oficial de la silueta de Chubut optimizado en Base64 institucional
  const LOGO_CHUBUT_BASE64 = "data:image/png;base64,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";

  // Renderizamos el HTML con estilos optimizados para A4 e inyección directa del Logo
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

        /* Membrete Institucional con espacio para Logo */
        .header-ministerio {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #f97316; /* Color naranja del logo */
          padding-bottom: 20px;
          margin-bottom: 25px;
        }
        .contenedor-identidad {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .logo-chubut {
          width: 65px;
          height: auto;
          object-fit: contain;
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
            <img 
              class="logo-chubut" 
              src="${LOGO_CHUBUT_BASE64}" 
              alt="Logo Oficial Chubut"
            />
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