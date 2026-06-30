# Preparación para demostración

## Objetivo
Preparar la aplicación para una presentación comercial y una venta clara, segura y profesional.

## Qué mostrar
- Cabecera institucional del Ministerio de Desarrollo Humano.
- Dashboard analítico con métricas de inventario, estados de remito y vencimientos.
- Gestión de usuarios y panel de auditoría.
- Registro de movimientos en tiempo real entre Nación y Provincia.
- Exportación a JSON, Excel y PDF.
- Copia de respaldo y restauración.

## Puntos fuertes técnicos
- Sincronización en tiempo real con Firebase Realtime Database.
- Escritura de datos unificada en `src/dataService.js`.
- Cola local de reintentos ante fallos de conexión (`src/dbQueue.js`).
- Configuración desde variables de entorno (`.env.example`).
- Soporte para uso local sin Firebase.
- UI institucional con estilo moderno y accesible.

## Recomendaciones para la demo
1. Mostrar primero la pantalla de login con roles y control de acceso.
2. Cargar un remito en la sección Nación y otro en Provincia.
3. Abrir el Dashboard para destacar métricas y gráficos.
4. Mostrar auditoría y cambio de usuario administrativamente.
5. Descargar exportaciones y restaurar un respaldo.
6. Explicar que las credenciales no están embebidas en el código.

## Requisitos previos
- Tener `.env` con credenciales válidas.
- Tener Firebase Realtime Database activo.
- Correr el proyecto con `npm run dev`.
- Si es demo local, abrir desde el mismo WiFi en otro dispositivo si se desea mostrar sincronización en vivo.

## Resultados esperados
- Sincronización rápida de movimientos.
- Interfaz limpia, institucional y lista para presentación.
- Datos escritos una sola vez y consistentes.
- Auditoría visible y navegación fluida.
