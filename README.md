# De trazos a emociones

Aplicación web que analiza dibujos infantiles con inteligencia artificial y los interpreta junto con el contexto del niño (edad, situación en casa o en el colegio, comportamiento reciente, cómo se hizo el dibujo). La premisa del proyecto es que un mismo trazo no significa lo mismo en todos los niños, así que la imagen sola no basta.

> **Aviso ético:** esta herramienta es un **apoyo orientativo** para docentes, familias y psicólogos. **No diagnostica** y **no reemplaza el criterio profesional**. Ningún texto, prompt ni pantalla de la aplicación debe presentarse como diagnóstico clínico.

## Contexto académico

Trabajo de grado de Ingeniería de Sistemas de la **Corporación Universitaria Adventista (UNAC)**, Medellín, presentado en la Semana de la Investigación UCO 2026. Es un proyecto en curso.

- **Autores:** Emerson Becerra Arce, Jorge Luis Eliss Quintana, Jesús Daniel Martínez Anaya.
- **Asesor:** Néstor Vélez Vargas.

**Objetivo general:** construir una herramienta tecnológica que permita identificar y expresar emociones infantiles mediante el dibujo digital para apoyar la prevención del maltrato infantil.

**Objetivos específicos:**
1. Identificar en la literatura las estrategias y plataformas tecnológicas utilizadas para el manejo y la expresión de emociones en niños.
2. Diseñar la estructura y la interfaz de la aplicación "De trazos a emociones", enfocada en la expresión emocional infantil.
3. Desarrollar la herramienta tecnológica aplicando técnicas básicas de análisis de color y trazo.
4. Validar la aplicación mediante una prueba piloto con un grupo de niños y docentes, analizando su efectividad y facilidad de uso.

## Cómo funciona

En la página `/app` hay dos modos:

- **Con contexto del niño** (3 pasos):
  1. **Contexto:** datos del niño (nombre, **fecha de nacimiento** —la edad se calcula sola—, género, situación actual, comportamiento reciente, diagnóstico previo opcional, y el contexto del dibujo: si fue espontáneo, comentarios, tiempo que tardó).
  2. **Dibujo:** se sube la imagen (arrastrando o seleccionando; JPG, PNG o WEBP).
  3. **Análisis:** rasgos observados, interpretación, emoción predominante, intensidad y lectura orientativa, con el aviso de que no reemplaza un diagnóstico.
- **Solo dibujo:** analiza un dibujo sin contexto y, al final, se decide **guardarlo como dibujo independiente**, **asignarlo a un niño existente** o **no guardarlo**.

El análisis en curso y el borrador del contexto **se conservan al cambiar de página**, y al terminar llega un aviso. El dashboard y el historial muestran el seguimiento por niño con datos reales; los dibujos independientes tienen su propia vista y pueden asignarse a un niño (y **reanalizarse con su contexto**).

## Stack real

**Importante:** los documentos académicos del trabajo de grado mencionan la API de Claude, pero el código **no usa ese servicio**. El análisis se ejecuta con **modelos locales servidos por Ollama**.

- **Frontend:** React 19 + Vite 8, React Router 7, `lucide-react`.
- **Backend:** Node.js + Express 5, `multer` (subida de imágenes) y `sharp` (redimensiona a máximo 800 px, JPEG calidad 80).
- **Autenticación:** JWT (`jsonwebtoken`) + `bcryptjs` con 12 rondas.
- **Base de datos:** MongoDB con Mongoose, conectada por `MONGO_URI` (el equipo usa MongoDB Atlas).
- **IA:** Ollama local en `http://127.0.0.1:11434/api/chat`, modelo `minicpm-v` por defecto (configurable con `OLLAMA_MODEL`). El JSON se fuerza por esquema (`format`) o `format: "json"` según `OLLAMA_FORMAT_MODE`. Existe además un modo simulado (`AI_MODE=mock`) para probar el flujo sin Ollama.
- **Estado global (frontend):** un React Context (`AnalisisSesionContext`) mantiene la sesión de análisis viva al navegar entre páginas y avisa cuando termina.

## Estructura del repositorio

La raíz del repositorio (donde está `.git`) solo contiene este README, `CLAUDE.md`, `.gitignore` y una carpeta anidada **con el mismo nombre del repo**, que es donde vive el código:

```text
De-trazos-a-emociones-WEB/          ← raíz del repo (.git)
├── README.md, CLAUDE.md, .gitignore
├── docs/                           ← PRUEBAS.md, legal/ (textos de términos y privacidad)
└── De-trazos-a-emociones-WEB/      ← carpeta del proyecto
    ├── package.json                ← dependencias del BACKEND (name: "de-trazos-a-emociones-backend")
    ├── backend/
    │   ├── server.js                ← app Express, rutas de análisis e historial
    │   ├── database.js              ← conexión Mongoose
    │   ├── models/User.js, Analysis.js
    │   ├── routes/auth.js           ← /auth/register y /auth/login
    │   └── middleware/authMiddleware.js
    ├── uploads/                     ← imágenes procesadas (ver "Privacidad y ética")
    └── frontend/                    ← proyecto Vite independiente, con su propio package.json
        ├── src/App.jsx, main.jsx, api.js, ProtectedRoute.jsx
        ├── src/context/            ← AnalisisSesionContext (sesión de análisis global)
        ├── src/pages/ (Login, Register, Analyzer, Dashboard, History, Terminos, Privacidad)
        ├── src/components/ (analyzer/, auth/, common/, dashboard/, history/, layout/)
        ├── src/data/actividades.js ← catálogo fijo de actividades por emoción
        └── src/utils/emociones.js  ← helpers de emoción, intensidad, edad y cumpleaños
```

El backend **no tiene su propio `package.json`**: sus dependencias están declaradas en el `package.json` de la raíz del proyecto (carpeta anidada), que ahora se llama `de-trazos-a-emociones-backend`. Se eliminaron el `middleware/` duplicado de la raíz del proyecto y el `routes/authRoutes.js` vacío.

## Requisitos

- Node.js 18 o superior.
- MongoDB (local o Atlas).
- [Ollama](https://ollama.com) instalado, con el modelo `minicpm-v` descargado.

## Instalación y ejecución

1. **Ollama**
   ```bash
   ollama pull minicpm-v
   ```
   Deja el servicio de Ollama corriendo (puerto `11434` por defecto).

2. **Backend**
   ```bash
   cd De-trazos-a-emociones-WEB
   npm install
   cp backend/.env.example backend/.env   # y completa los valores reales
   npm start        # equivale a: node backend/server.js
   # o, con recarga automática en desarrollo:
   npm run dev      # node --watch backend/server.js
   ```
   El servidor arranca en el puerto `3000` por defecto. Puedes ejecutarlo desde la carpeta del proyecto con `npm start` / `npm run dev`; las rutas de `.env` y de la carpeta de subidas se resuelven respecto a la ubicación de `server.js`.

3. **Frontend**
   ```bash
   cd De-trazos-a-emociones-WEB/frontend
   npm install
   npm run dev
   ```
   Disponible en `http://localhost:5173`. El archivo `src/api.js` tiene fija la URL `http://localhost:3000` del backend.

## Variables de entorno

Definidas en `De-trazos-a-emociones-WEB/backend/.env` (ver plantilla en [`backend/.env.example`](De-trazos-a-emociones-WEB/backend/.env.example)):

| Variable | Obligatoria | Por defecto | Descripción |
|---|---|---|---|
| `MONGO_URI` | Sí | — | Cadena de conexión a MongoDB. Si falta, el proceso termina. |
| `JWT_SECRET` | Sí | — | Secreto para firmar los JWT. |
| `JWT_EXPIRES_IN` | No | `24h` | Vigencia del token. Al expirar, la app redirige al login. |
| `PORT` | No | `3000` | Puerto del backend. |
| `ADMIN_EMAILS` | No | — | Correos de administradores (coma). Quien se registre con uno queda admin y aprobado; los demás quedan pendientes hasta que un admin los apruebe. |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Origen(es) permitido(s) para CORS, separados por coma. |
| `DNS_SERVERS` | No | DNS del sistema | Servidores DNS a forzar (coma), solo si la red no resuelve el SRV de Atlas (`queryTxt ETIMEOUT`). Ej.: `8.8.8.8,1.1.1.1`. |
| `OLLAMA_FORMAT_MODE` | No | `schema` | Cómo se fuerza el JSON en Ollama: `schema` (requiere Ollama ≥ 0.5.0) o `json` (versiones más antiguas). |
| `AI_MODE` | No | `ollama` | Motor de análisis: `ollama` (real) o `mock` (resultado simulado para probar el flujo sin Ollama). |
| `OLLAMA_MODEL` | No | `minicpm-v` | Modelo de visión para el análisis. |
| `OLLAMA_NUM_PREDICT` | No | `4000` | Longitud máxima de la respuesta. Bájalo en equipos sin GPU para que no tarde tanto. |
| `OLLAMA_NUM_CTX` | No | `8192` | Tamaño del contexto. Bájalo en equipos con pocos recursos. |

> **Modo simulado (`AI_MODE=mock`):** con este valor, `/analizar-imagen` **no llama a Ollama**; devuelve en 2-3 segundos un resultado de ejemplo (marcado con `simulado: true`) y lo guarda en MongoDB como un análisis normal. La interfaz muestra el aviso "Resultado simulado (modo de prueba)". Sirve para probar el flujo completo en equipos sin Ollama. **Nunca debe usarse en la prueba piloto ni con dibujos reales.**

## API

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/` | No | Texto de prueba. |
| POST | `/auth/register` | No | Registro. Campos: `nombre`, `apellido`, `email`, `password` (mínimo 8 caracteres), `rol` (`padre` \| `psicologo` \| `profesor`), `institucion` (opcional). La cuenta queda **pendiente** de aprobación (o aprobada si el correo está en `ADMIN_EMAILS`). |
| POST | `/auth/login` | No | Inicio de sesión. Bloquea las cuentas no aprobadas (403). Devuelve `{ token, usuario: { id, nombre, email, rol, esAdmin } }`. |
| POST | `/analizar-imagen` | Bearer | `multipart/form-data` con el campo `imagen` + campos de contexto del niño. Llama a Ollama y devuelve `{ analisis, id, imagen }`. Con `persistir=false` analiza sin guardar (modo "solo dibujo"). |
| GET | `/analisis` | Bearer | Historial de análisis del usuario autenticado, del más reciente al más antiguo. |
| DELETE | `/analisis/:id` | Bearer | Elimina un análisis y su imagen. |
| POST | `/analisis/eliminar-varios` | Bearer | Elimina varios análisis por lista de ids (p. ej. al borrar un niño en cascada). |
| PATCH | `/analisis/:id/asignar` | Bearer | Asigna un dibujo independiente a un niño. |
| POST | `/analisis/:id/reanalizar` | Bearer | Reanaliza un dibujo con el contexto del niño. |
| POST | `/analisis/guardar` | Bearer | Guarda un análisis que se hizo sin persistir (independiente o asignado a un niño). |
| POST | `/analisis/descartar` | Bearer | Descarta un análisis no guardado y borra su imagen temporal. |
| GET | `/analisis/:id/imagen` | Bearer | Sirve la imagen del dibujo solo al usuario dueño (no hay carpeta pública). |
| GET | `/perfil/me` | Bearer | Datos del usuario autenticado (incluye `institucion`, `esAdmin`, `tieneFoto`). |
| POST | `/perfil/foto` | Bearer | Sube/actualiza la foto de perfil (`multipart`, campo `foto`; se recorta a 256×256). |
| GET | `/perfil/foto` | Bearer | Sirve la foto de perfil del propio usuario. |
| DELETE | `/perfil` | Bearer | Elimina la cuenta y, en cascada, sus análisis, imágenes y foto. |
| GET | `/admin/usuarios?estado=` | Bearer (admin) | Lista usuarios por estado (`pendiente` por defecto). |
| PATCH | `/admin/usuarios/:id` | Bearer (admin) | Aprueba o rechaza una cuenta (`{ accion: "aprobar" \| "rechazar" }`). |

## Estado del proyecto

**Implementado:**
- Registro e inicio de sesión con JWT; el login guarda el usuario y el rol viaja en el token.
- Rutas de subida corregidas (resueltas respecto a `server.js`) e **imágenes protegidas tras autenticación** (`GET /analisis/:id/imagen`, sin carpeta pública).
- `/app` con dos modos: **con contexto** (3 pasos) y **solo dibujo**. El análisis en curso y el borrador del contexto se conservan al cambiar de página, y al terminar llega un aviso.
- Prompt reescrito con encuadre orientativo: `rasgos_observados`, `interpretacion`, `emocion_predominante`, `intensidad`, `lectura_orientativa`; sin lenguaje clínico.
- **Dashboard e historial con datos reales** por niño (resumen, línea de tiempo, gráfica de emociones y comparación "antes y ahora" de dos análisis reales). Actividades sugeridas desde un catálogo fijo por emoción (`src/data/actividades.js`), no generadas por IA.
- Agregar y eliminar niño (borrado en cascada de sus análisis e imágenes).
- Dibujos independientes (tarjetas) con opción de asignarlos a un niño y reanalizarlos con su contexto.
- **Fecha de nacimiento** en lugar de edad (la edad se calcula) y recordatorio de cumpleaños.
- Términos y Condiciones y Política de Privacidad con contenido real, enlazados desde el registro.
- Marca "De trazos a emociones" y tipografía consistente en todas las páginas.
- Límite de tamaño (8 MB) y de tipo (JPG, PNG, WEBP) en la subida; CORS restringido a `CORS_ORIGIN`; `dns.setServers` ahora es opcional (`DNS_SERVERS`).
- Modo simulado (`AI_MODE=mock`) para probar el flujo sin Ollama.
- **Acceso protegido:** todas las páginas privadas exigen sesión válida; si el token (24 h) expira, la app redirige al login.
- **Registro con aprobación del administrador:** las cuentas nuevas quedan pendientes; el admin (definido por `ADMIN_EMAILS`) las aprueba o rechaza en `/admin` viendo nombre, correo, rol e institución.
- **Menú de perfil/cuenta:** foto de perfil, ver correo, cerrar sesión, cambiar de cuenta y eliminar cuenta.
- **Eliminar cuenta con permiso y sin borrados por accidente:** solo puede eliminar su cuenta quien tenga el permiso «Eliminar su cuenta», que asigna el administrador (nunca viene por defecto, tampoco en cuentas antiguas; un administrador no puede eliminar la suya). La cuenta no se borra: queda desactivada, con sus datos, y no puede iniciar sesión. El administrador la ve en «Cuentas eliminadas» de `/admin` y la restaura o la elimina definitivamente, con todos sus análisis e imágenes.
- **Contraseña olvidada:** en el inicio de sesión, «¿Olvidaste tu contraseña?» indica contactar al administrador. Las contraseñas se guardan cifradas (bcrypt) y nadie puede verlas, ni el administrador: en `/admin` (Aprobados), «Restablecer contraseña» genera una temporal que se muestra una sola vez para dársela al usuario. Al entrar con ella, la app solo deja ir a Configuración › Seguridad hasta que la cambie por una suya.
- **Tema claro/oscuro y 4 paletas de color** (página de Configuración), guardado por dispositivo.
- **Exportar a PDF** con selección de contenido (detalle del análisis y/o historial del niño).

**Pendiente:**
- Botones "Contactar especialista" y "Reportes": implementarlos o deshabilitarlos con "Próximamente".
- No hay tests automatizados.

> La **autorización del representante legal** no se valida dentro de la aplicación por decisión del proyecto: su obtención y verificación son responsabilidad de la institución o entidad profesional (ver Términos y Privacidad).
>
> El detalle completo del plan por pasos y el estado de cada problema están en `CLAUDE.md`.

## Privacidad y ética

- La aplicación procesa dibujos y datos de menores de edad; su uso requiere **consentimiento informado** de los padres o tutores y del centro educativo/clínico correspondiente.
- **Las imágenes de los dibujos no son públicas:** se sirven solo al usuario autenticado dueño del análisis (`GET /analisis/:id/imagen`); no hay carpeta estática abierta. El frontend las carga con el token (`fetch` → blob → `URL.createObjectURL`).
- **La carpeta `uploads/` no se versiona en git** (`De-trazos-a-emociones-WEB/uploads/` y `De-trazos-a-emociones-WEB/backend/uploads/` están en `.gitignore`). Anteriormente había ~120 imágenes versionadas en el repositorio; eran **imágenes de prueba tomadas de internet, no dibujos reales de niños**, y ya se quitaron del seguimiento de git (los archivos siguen en disco localmente, pero no se suben a GitHub). No vuelvas a versionar imágenes de esa carpeta, sean de prueba o reales.
- Evita registrar datos sensibles innecesarios (por ejemplo, el nombre real del niño o un diagnóstico previo en texto libre); cuando sea posible, usa alias.
- Ningún texto de la interfaz, del prompt de IA o de la documentación debe presentarse como diagnóstico clínico.

## Autores y licencia

- Emerson Becerra Arce, Jorge Luis Eliss Quintana, Jesús Daniel Martínez Anaya.
- Asesor: Néstor Vélez Vargas.
- **Licencia:** pendiente de definir.
