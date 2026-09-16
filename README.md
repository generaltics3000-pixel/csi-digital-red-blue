# 🛡️ CSI Digital: Red Team vs Blue Team

Plataforma web en tiempo real para digitalizar y dinamizar la actividad **Red Team vs Blue Team** del taller escolar de ciberseguridad **CSI Digital**.

Permite al docente/facilitador crear sesiones, proyectar el temporizador y las consignas en pantalla gigante, distribuir el material del caso (phishing por correo, estafas por WhatsApp) a los teléfonos celulares de los alumnos sin instalación ni registro, recolectar respuestas en vivo y conducir la puesta en común, revelación de anomalías y podio final de forma 100% automatizada.

---

## 🚀 Inicio Rápido

### 1. Instalación de dependencias
```bash
npm install
```

### 2. Iniciar el servidor
```bash
npm start
```
El servidor quedará disponible en `http://localhost:3000`.

> 🪐 **¿Usas Antigravity?** Consulta la [Guía Paso a Paso para Antigravity](GUIA_ANTIGRAVITY.md) para levantar el proyecto en 1 clic y colaborar asistido por IA.

---

## 📱 Pantallas y Accesos del Sistema

| Vista | URL | Descripción |
| :--- | :--- | :--- |
| **📱 Alumnos (Celular)** | `http://localhost:3000/` | Acceso rápido con código de 4 dígitos o QR. Interfaz adaptada para celular según el rol (**Red Team** atacantes o **Blue Team** defensores). |
| **👩‍🏫 Facilitador (Notebook)** | `http://localhost:3000/facilitador.html` | Panel de control completo: crear sesión, asignar roles, controlar cronómetro, monitorear entregas en vivo, calificar y cambiar la proyección a distancia. |
| **📽️ Proyector / TV (16:9)** | `http://localhost:3000/proyeccion.html?code=CSI-XXXX` | Vista de proyección optimizada para pantalla gigante en el aula (Lobby, En Juego, Puesta en Común, Revelación y Ranking). |

---

## 🎯 Flujo del Taller en el Aula

1. **Creación de Sesión (Facilitador)**:
   - El facilitador ingresa a `/facilitador.html`, elige el caso (*El correo del banco* o *WhatsApp de la beca falsa*), define cantidad de grupos (2 a 10) y duración del cronómetro (ej. 15 min).
2. **Lobby & Conexión de Alumnos**:
   - En la pantalla de proyección se muestra el código y el QR gigante. Los alumnos escanean el QR desde sus celulares y eligen su grupo.
3. **Inicio de la Dinámica**:
   - El facilitador presiona **Iniciar**. El cronómetro sincronizado comienza a correr en todos los dispositivos y en la pantalla gigante.
   - **Red Team** analiza el material y redacta cómo armaría el engaño (historia, urgencia y trampa técnica).
   - **Blue Team** analiza el mismo material, marca las 5 anomalías técnicas en el checklist y escribe 3 recomendaciones de defensa.
   - Todos los borradores se guardan automáticamente en `localStorage` ante posibles cortes de Wi-Fi escolar.
4. **Puesta en Común**:
   - El facilitador pasa la proyección a modo **Puesta en Común** y navega grupo por grupo mostrando sus respuestas en grande.
5. **Revelación de Anomalías**:
   - Se proyecta el material con **puntos de alerta animados e interactivos** superpuestos, explicando cada una de las 5 señales forenses.
6. **Ranking y Cierre**:
   - Podio interactivo con cálculo automático de puntos por aciertos, bonos de velocidad y confeti digital.
   - Exportación de reporte imprimible/PDF para el docente.

---

## 📂 Casos Precargados en v1

1. **Caso 1: El correo del banco (Phishing bancario)**:
   - Suplantación de identidad bancaria con dominio falso (`@banconac1on-verificacion.com`), urgencia de 24hs, saludo genérico, enlace fraudulento `.xyz` y adjunto malicioso `.exe`.
2. **Caso 2: WhatsApp de la beca falsa (Smishing)**:
   - Mensaje de estafa que promete $150.000 con límite de 30 minutos, pidiendo claves bancarias/Token mediante un enlace gratuito `.free.nf` y exigiendo confidencialidad.
3. **Casos Personalizados**:
   - Formulario para cargar nuevos casos en vivo sin modificar código.

---

## 🛠️ Tecnologías

- **Backend**: Node.js, Express, Socket.IO, QRCode.
- **Frontend**: HTML5 Semántico, Vanilla CSS (Dark Cyberpunk / Glassmorphism), ES6+ JavaScript.
- **Audio**: Web Audio API sintetizada (alertas de tiempo, beeps, fanfarria).
- **Gamificación**: Canvas Confetti, cálculo de puntos, podio interactivo y modo offline-first con `localStorage`.
