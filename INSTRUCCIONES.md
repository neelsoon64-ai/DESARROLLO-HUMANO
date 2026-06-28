# 📦 Sistema de Inventario — Ministerio de Desarrollo Humano

Sistema de gestión de inventario con dos secciones (Nación / Provincia), carga de remitos con foto, control de usuarios (admin / usuario común), auditoría completa, y exportación a Excel/PDF.

Funciona **en tiempo real entre PC y celular** usando Firebase (gratis).

---

## ✅ PASO 1 — Instalar lo necesario

Necesitás tener instalado **Node.js** (versión 18 o superior). Si no lo tenés:
👉 Descargalo de https://nodejs.org (elegí la versión LTS)

Para verificar que ya lo tenés, abrí una terminal y escribí:
```bash
node --version
```

---

## ✅ PASO 2 — Abrir el proyecto

1. Descomprimí este ZIP en una carpeta.
2. Abrí esa carpeta con **Visual Studio Code**.
3. Abrí una terminal dentro de VS Code: menú **Terminal → Nueva Terminal**.

---

## ✅ PASO 3 — Instalar las dependencias

En la terminal de VS Code, escribí:

```bash
npm install
```

Esto va a tardar un minuto. Descarga todo lo necesario (React, Firebase, Excel, etc.).

---

## ✅ PASO 4 — Crear tu base de datos gratis en Firebase

Esto es lo que permite que el sistema se sincronice en tiempo real entre la PC y el celular.

### 4.1 Crear el proyecto

1. Andá a **https://console.firebase.google.com**
2. Iniciá sesión con una cuenta de Google (podés usar una nueva o la que ya tengas).
3. Hacé clic en **"Crear un proyecto"** (o "Add project").
4. Ponele un nombre, por ejemplo: `inventario-mdh`
5. Podés desactivar Google Analytics (no lo necesitás) → **Crear proyecto**.

### 4.2 Crear la app web

1. Dentro del proyecto, hacé clic en el ícono **"</>"** (Web) para agregar una app.
2. Ponele un apodo, por ejemplo: `inventario-web`
3. **NO** marques "Firebase Hosting" (no es necesario por ahora).
4. Hacé clic en **"Registrar app"**.
5. Firebase te va a mostrar un bloque de código como este:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "inventario-mdh.firebaseapp.com",
  projectId: "inventario-mdh",
  storageBucket: "inventario-mdh.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

📋 **Copiá ese bloque completo.**

### 4.3 Pegar la configuración en el proyecto

1. En VS Code, abrí el archivo: **`src/firebase.js`**
2. Reemplazá el objeto `firebaseConfig` de ejemplo por el que copiaste de Firebase.
3. Guardá el archivo (Ctrl+S / Cmd+S).

### 4.4 Activar Firestore (la base de datos)

1. En la consola de Firebase, en el menú izquierdo, hacé clic en **"Firestore Database"**.
2. Hacé clic en **"Crear base de datos"**.
3. Elegí **"Iniciar en modo de prueba"** (test mode) — esto permite leer/escribir sin configurar reglas complejas al principio.
4. Elegí la ubicación del servidor, por ejemplo `southamerica-east1` (São Paulo, la más cercana a Argentina).
5. Hacé clic en **"Habilitar"**.

⚠️ **Importante sobre seguridad:** el modo de prueba deja la base de datos abierta por 30 días. Como esta app ya tiene su propio sistema de usuarios y contraseñas adentro, es aceptable para uso interno, pero si querés reforzarlo más adelante, pedime ayuda para configurar las reglas de Firestore correctamente.

### 4.5 Activar Storage (para las fotos de los remitos)

1. En el menú izquierdo, hacé clic en **"Storage"**.
2. Hacé clic en **"Comenzar"** / **"Get started"**.
3. Elegí también **"Iniciar en modo de prueba"**.
4. Confirmá la misma ubicación que elegiste antes.
5. Hacé clic en **"Listo"**.

---

## ✅ PASO 5 — Correr el sistema

En la terminal de VS Code:

```bash
npm run dev
```

Vas a ver algo como:

```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.X:5173/
```

- **Local**: para abrir en tu PC (Chrome, Edge, etc.)
- **Network**: para abrir desde tu **celular**, siempre que esté conectado al mismo WiFi que la PC.

---

## ✅ PASO 6 — Usar el sistema

**Usuarios de prueba ya cargados:**

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin123` | 🔑 Administrador |
| `juaniparraguirre` | `juan123` | 🔑 Administrador |
| `operador1` | `op123` | 👤 Usuario común |
| `operador2` | `op456` | 👤 Usuario común |

⚠️ **Recomendación:** una vez que entres como admin, cambiá estas contraseñas desde "Gestionar Usuarios" o creá usuarios nuevos y eliminá estos de prueba.

---

## 📱 ¿Cómo lo uso desde el celular al mismo tiempo que la PC?

Mientras tengas `npm run dev` corriendo en tu PC:

1. Conectá el celular a la **misma red WiFi** que la PC.
2. En el celular, abrí el navegador y entrá a la dirección que dice **"Network"** en la terminal (por ejemplo `http://192.168.1.5:5173`).
3. Iniciá sesión normalmente.
4. Cualquier carga que hagas desde el celular va a aparecer automáticamente en la PC (y viceversa), sin necesidad de recargar la página.

---

## 🌐 ¿Cómo lo dejo funcionando siempre, sin depender de mi PC prendida?

Para eso hay que "publicarlo" en internet (deploy). Las opciones más simples y gratuitas son:

- **Vercel** (recomendado, muy simple): https://vercel.com
- **Netlify**: https://netlify.com
- **Firebase Hosting** (ya que estás usando Firebase): se hace con `firebase deploy`

Si querés, pedime ayuda en el chat para hacer el deploy a cualquiera de estas opciones y te guío paso a paso.

---

## 🛠️ Estructura del proyecto

```
inventario-mdh/
├── src/
│   ├── App.jsx                 → componente principal
│   ├── firebase.js             → ⚠️ ACÁ VAN TUS CREDENCIALES DE FIREBASE
│   ├── useSharedState.js       → sincronización en tiempo real
│   ├── fotoStorage.js          → subida de fotos de remitos
│   ├── exportUtils.js          → exportación a Excel y PDF
│   ├── constants.js            → categorías, usuarios iniciales, etc.
│   ├── styles.js                → estilos compartidos
│   └── components/
│       ├── Login.jsx
│       ├── ModalRemito.jsx     → carga/edición de remitos con foto
│       ├── ModalDetalle.jsx
│       ├── PanelAuditoria.jsx  → el "buchón" — quién hizo qué
│       ├── PanelUsuarios.jsx   → gestión de usuarios (solo admin)
│       ├── Seccion.jsx         → Nación / Provincia
│       └── Common.jsx
├── package.json
└── INSTRUCCIONES.md            → este archivo
```

---

## ❓ Problemas comunes

**"npm: command not found"** → No tenés Node.js instalado. Instalalo de nodejs.org.

**La app abre pero dice "Modo local · Sin sincronizar"** → Todavía no pegaste tus credenciales de Firebase en `src/firebase.js`, o hay un error de tipeo. Revisá que copiaste el objeto `firebaseConfig` completo y correctamente.

**Desde el celular no carga la página** → Verificá que el celular y la PC estén en la misma red WiFi, y que el firewall de Windows no esté bloqueando el puerto 5173 (puede pedir permiso la primera vez, aceptalo).

**Las fotos no se suben** → Revisá que activaste "Storage" en Firebase (Paso 4.5), no solo Firestore.

---

¿Dudas o querés agregar algo más? Volvé al chat de Claude y pedime ayuda. 🙂
