# 🚀 Guía de Instalación y Uso con Antigravity

Esta guía explica cómo clonar, levantar y trabajar con este proyecto en una máquina local utilizando **Antigravity IDE** o cualquier entorno con **Node.js**.

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu computadora:

1. **Git**: Para clonar el repositorio ([Descargar Git](https://git-scm.com/)).
2. **Node.js** (versión 18 o superior): Motor de ejecución para el servidor ([Descargar Node.js](https://nodejs.org/)).
3. **Antigravity IDE**: Entorno de desarrollo con IA asistida.

---

## 📥 Paso 1: Aceptar la Invitación en GitHub

1. Revisa tu casilla de **correo electrónico** (el mail con el que fuiste invitado).
2. Abre el correo de notificación de GitHub con el asunto *"Invitation to join [usuario]/[repositorio]"*.
3. Haz clic en el botón verde **"Accept invitation"** (Aceptar invitación).
4. Inicia sesión con tu cuenta de GitHub (o regístrate gratis si aún no tienes una).

---

## 💻 Paso 2: Clonar el Repositorio

Abre una terminal (o consola) en la carpeta donde deseas guardar tus proyectos y ejecuta:

```bash
git clone https://github.com/generaltics3000-pixel/csi-digital-red-blue.git
```

Luego ingresa a la carpeta del proyecto:
```bash
cd csi-digital-red-blue
```

---

## 🪐 Paso 3: Abrir el Proyecto en Antigravity

1. Abre **Antigravity IDE**.
2. En el menú superior, selecciona **File** > **Open Folder...** (o *Abrir Carpeta*).
3. Selecciona la carpeta del proyecto que acabas de clonar.

---

## ⚡ Paso 4: Levantar el Proyecto

Puedes levantarlo de dos maneras:

### Opción A: Dejando que Antigravity lo haga por ti (Vía Chat)
Simplemente escríbele a Antigravity en la barra de chat:
> *"Instalá las dependencias y levantá el servidor local de este proyecto"*

Antigravity ejecutará los comandos de instalación y arranque de manera autónoma.

---

### Opción B: Mediante la Terminal Integrada de Antigravity
1. Abre la terminal integrada con el atajo `` Ctrl + ` `` (o menú **Terminal** > **New Terminal**).
2. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm start
   ```
4. Verás en la consola un mensaje similar a:
   ```text
   🛡️ CSI Digital Servidor iniciado en http://localhost:3000
   ```

---

## 🌐 Paso 5: Acceder a las Vistas del Sistema

Una vez iniciado el servidor, abre tu navegador web:

| Vista | URL | ¿Quién la usa? |
| :--- | :--- | :--- |
| **👩‍🏫 Panel del Facilitador** | `http://localhost:3000/facilitador.html` | El docente / facilitador para configurar salas, grupos y casos. |
| **📽️ Pantalla de Proyección** | `http://localhost:3000/proyeccion.html` | Se proyecta en proyector o pantalla grande en el aula. |
| **📱 Vista Alumnos** | `http://localhost:3000/` | Pantalla de ingreso con PIN o escaneando el código QR. |

---

## 💡 Consejos de Desarrollo con Antigravity

- **Para crear nuevos casos de ciberseguridad**: Puedes pedirle al agente de Antigravity:
  > *"Agregá un nuevo caso interactivo sobre fraude bancario por SMS en server/defaultCases.js"*
- **Para ejecutar pruebas del flujo completo**:
  ```bash
  npm test
  ```
- **Para detener el servidor**: Presiona `Ctrl + C` en la terminal de Antigravity.
