# Inventario MDH

Aplicación web de gestión de inventario para el Ministerio de Desarrollo Humano.

## Qué incluye
- Sincronización en tiempo real con Firebase Realtime Database.
- Control de stock dividido en Nación y Provincia.
- Registro de remitos con fotos y estado de remito.
- Gestión de usuarios con roles y panel de auditoría.
- Exportación a JSON, Excel y PDF.
- Caché local para uso sin conexión.

## Arquitectura
- `src/App.jsx`: lógica principal y plataforma de inventario.
- `src/useSharedState.js`: hook de sincronización con Firebase + fallback local.
- `src/dataService.js`: capa de escritura única y reintentos en cola.
- `src/dbQueue.js`: cola local para operaciones fallidas.
- `src/firebase.js`: configuración y autenticación de Firebase.
- `src/components/*`: UI institucional y paneles.

## Mejora de seguridad
- La configuración de Firebase ahora se carga desde variables de entorno.
- Recomendado mantener archivos `.env` fuera del repositorio.
- Reglas de Firebase Realtime Database se definen en `database.rules.json`.
- Se recomienda activar Firebase App Check para producción.
- La app ahora carga credenciales desde `.env` y no debe dejarse con datos sensibles en el repositorio.

## Cómo ejecutar
1. Copiá `.env.example` a `.env`.
2. Pegá las credenciales de Firebase en `.env`.
3. Instalá dependencias:
   ```bash
   npm install
   ```
4. Iniciá el servidor local:
   ```bash
   npm run dev
   ```

### Credenciales de Firebase necesarias
La app requiere las siguientes variables de entorno en `.env`:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_APP_CHECK_SITE_KEY` (opcional, recomendado para App Check en producción)

## Documentación adicional
- `INSTRUCCIONES.md`: guía paso a paso para configurar y usar el sistema.
- `database.rules.json`: reglas de seguridad para Firebase Realtime Database.

## Preparación para demostración
- La UI ya incluye una cabecera institucional, tarjetas de métricas y tablero analítico.
- El sistema informa si Firebase no está configurado o si existe cola de sincronización.
- El código ahora evita escribir la misma información dos veces en Firebase.
