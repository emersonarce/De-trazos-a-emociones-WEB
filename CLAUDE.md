# CLAUDE.md — De trazos a emociones

Contexto técnico para futuras sesiones de trabajo con Claude Code en este repositorio. Para el contexto académico y de producto, ver [README.md](README.md).

## 1. Estado real del código

IMPORTANTE: los documentos académicos dicen que el análisis usa la API de Claude. El código **no** hace eso: usa modelos locales con Ollama. Describe siempre el código tal como está.

**Stack:**
- Frontend: React 19 + Vite 8, React Router 7, lucide-react.
- Backend: Node.js + Express 5, Multer (subida de imágenes) y Sharp (redimensiona a máximo 800 px, JPEG calidad 80).
- Autenticación: JWT (jsonwebtoken) + bcryptjs con 12 rondas.
- Base de datos: MongoDB con Mongoose, conectada por `MONGO_URI` (el equipo usa MongoDB Atlas).
- IA: Ollama local en `http://127.0.0.1:11434/api/chat`. Imágenes con el modelo `minicpm-v`. La ruta de texto `/preguntar` usa `llama-3.2-vision`.

**Estructura:** la raíz del repo solo tiene `.gitignore`, `README.md`, `CLAUDE.md` y una carpeta anidada con el mismo nombre.
- `De-trazos-a-emociones-WEB/` (raíz, tiene `.git`)
  - `De-trazos-a-emociones-WEB/` (carpeta del proyecto)
    - `package.json`: dependencias del BACKEND (name: `proyecto-ollama`). El backend no tiene `package.json` propio.
    - `backend/server.js`: punto de entrada (carga `.env`, conecta MongoDB y escucha el puerto).
    - `backend/app.js`: app Express (middlewares, rutas, frontend compilado y manejo de errores). Se puede probar sin base de datos.
    - `backend/routes/analisis.js`: `/analizar-imagen` y todos los `/analisis/*`.
    - `backend/services/ia/`: análisis con IA. `index.js` (`obtenerAnalisisIA`), `variantes.js` (`IA_VARIANTE`: estructurado | equilibrado | libre), `prompt.js`, `parseo.js`, `contexto.js`, `esquema.js` y `proveedores/` (ollama, mock).
    - `backend/utils/imagen.js`: redimensionado y lectura de píxeles con sharp o, si no carga, Jimp.
    - `backend/services/medicionImagen.js`: medición de color y trazo sobre la imagen, sin IA (colores predominantes, uso de la hoja, tonos, intensidad del color, relleno o línea). Se guarda en `resultado_ia.medicion_imagen` al analizar y al reanalizar; el frontend la muestra con `components/common/MedicionImagen.jsx` y en el PDF.
    - `backend/tests/`: pruebas con `node --test` (`npm test` en la carpeta del proyecto).
    - `backend/scripts/comparar-variantes.js`: compara las variantes del análisis con dibujos reales (`npm run comparar -- dibujo.jpg`); el informe queda en `comparaciones/` (ignorado por git).
    - `backend/scripts/demo.js`: banco de datos de PRUEBA, solo para uso local. `npm run demo:crear` crea un usuario demo (`demo@detrazos.test` / `demo1234`) con 8 niños inventados, unos 500 análisis y dibujos generados por código (`backend/scripts/demo/`) en una base aparte (la de `MONGO_URI` con `_demo` al final; se niega a usar otra) e imágenes `uploads/demo-*`. `npm run dev:demo` arranca el backend con esa base y `npm run demo:borrar` la elimina. Las fechas se calculan al crearlo: hay que regenerarlo para que los cumpleaños y las alertas caigan en el día actual.
    - `backend/database.js`: conexión Mongoose.
    - `backend/models/User.js` y `backend/models/Analysis.js`.
    - `backend/routes/auth.js`: `/auth/register` y `/auth/login`.
    - `backend/routes/authRoutes.js`: VACÍO (0 bytes).
    - `backend/middleware/authMiddleware.js`.
    - `middleware/authMiddleware.js`: DUPLICADO idéntico al de `backend/`, no se usa.
    - `uploads/`: 120 imágenes versionadas en git.
    - `frontend/`: proyecto Vite independiente, con su propio `package.json`.
      - `src/`: `App.jsx`, `main.jsx`, `api.js`, `ProtectedRoute.jsx`.
      - `src/pages/`: Login, Register, Analyzer, Dashboard, History.
      - `src/components/`: `analyzer/`, `auth/`, `dashboard/`, `history/`, `layout/`.
      - Avisos: usar `useAvisos()` (`src/context/AvisosContext.jsx`, se muestran con `components/common/AvisosFlotantes.jsx`), nunca `alert()`. En login y registro, `components/auth/AuthAviso.jsx`.
      - Imágenes protegidas de un análisis: `src/hooks/useImagenAnalisis.js`.

**Cómo se ejecuta hoy:**
1. Ollama: instalarlo, ejecutar `ollama pull minicpm-v` y dejar el servicio corriendo en el puerto 11434.
2. Backend: en la carpeta del proyecto ejecutar `npm install`; luego `cd backend`, crear `backend/.env` (ver `backend/.env.example`) y ejecutar `node server.js` (puerto 3000 por defecto). Hay que arrancarlo DESDE `backend/`, porque `.env` y la carpeta de subidas se resuelven relativos al directorio actual.
3. Frontend: `cd frontend`, `npm install`, `npm run dev` (http://localhost:5173). El archivo `src/api.js` tiene fija la URL `http://localhost:3000`.

**Variables de entorno (`backend/.env`):**
- `MONGO_URI`: obligatoria; si falta, el proceso termina.
- `JWT_SECRET`: obligatoria.
- `JWT_EXPIRES_IN`: por defecto 2h.
- `PORT`: por defecto 3000.

Plantilla disponible en `backend/.env.example`.

**API:**
- `GET /salud` → sin auth, texto de prueba (en `/` se sirve el frontend compilado si existe `frontend/dist`).
- `POST /auth/register` → sin auth. Campos: nombre, apellido, email, password (mínimo 8), rol (padre | psicologo | profesor).
- `POST /auth/login` → sin auth. Devuelve `{ token, usuario: { id, nombre, email } }`.
- `POST /analizar-imagen` → Bearer. `multipart/form-data` con "imagen" + campos de contexto. Llama a Ollama, guarda en MongoDB y devuelve `{ analisis, id, imagen }`.
- `GET /analisis` → Bearer. Historial del usuario, del más reciente al más antiguo.
- `POST /preguntar` → Bearer. Pregunta de texto a Ollama; el frontend no la usa.
- `GET /uploads/*` → archivos estáticos de las imágenes procesadas.

**Modelos de datos:**
- `User`: nombre, apellido, email (único), password (hash), rol, timestamps.
- `Analysis`: usuarioId; `contexto_nino` { nombre, edad, fecha_nacimiento, genero, situacion_actual, comportamiento, diagnostico_previo, dibujo_espontaneo, comento_mientras, tiempo_dibujo, descripcion_dibujo (desde 2026-10-30; los análisis anteriores no la tienen) }; ruta_imagen; resultado_ia (Mixed; desde 2026-10-31 incluye `medicion_imagen`, los análisis anteriores no la tienen); independiente; analizado_sin_contexto; fecha.

**Flujo de la app:**
- Registro e inicio de sesión. El token se guarda en `localStorage` y el login redirige a `/app`.
- `/app` (Analyzer) tiene tres pasos: Contexto, Dibujo (subir imagen) y Análisis (emoción predominante, intensidad y texto completo).
- El prompt pide al modelo un JSON: `{ emocion_predominante, intensidad (baja|media|alta), analisis_completo }`.
- `/dashboard` y `/historial` están protegidos y consultan `/analisis`, pero la mayoría de sus tarjetas muestran datos simulados.

## 2. Problemas encontrados (por prioridad)

**P0-1 (CRÍTICO) — ✅ RESUELTO (commit `3f79f41`)** — La pantalla `/app` salía en blanco. En `frontend/src/pages/Analyzer.jsx` la función `analyze` no cerraba su llave después del `try/catch/finally`. Todo lo siguiente quedaba DENTRO de `analyze`: `KEYWORDS`, `processResult`, `resetAll`, `STYLES` y el `return` con el JSX. Por eso el componente no devolvía nada. Se cerró `analyze` justo después del `finally`, se quitó la llave sobrante al final del archivo y se limpiaron los imports sin usar. Verificado con `npm run lint` (0 errores en ese archivo) y `npm run build`.

**P0-2 (CRÍTICO) — ✅ RESUELTO (commit `b9d4ce4`)** — Había ~120 imágenes de dibujos versionadas en `De-trazos-a-emociones-WEB/uploads/` en un repositorio público. Confirmado con el equipo: eran imágenes de prueba tomadas de internet, no dibujos reales de niños. Se agregaron reglas al `.gitignore` (raíz y `backend/.gitignore`) para `uploads/` en ambas ubicaciones, se hizo `git rm -r --cached` sobre la carpeta (los archivos siguen en disco local, NO se borraron ni se reescribió el historial) y se agregaron `.gitkeep` para que la carpeta exista en un clon nuevo.

**P1-1** — Rutas de subida inconsistentes. Multer guarda en `"uploads/"` (relativo al directorio actual), pero `express.static` sirve desde `path.join(__dirname, "uploads")`. Hay que usar `path.join(__dirname, "uploads")` en ambos y crear la carpeta si no existe.

**P1-2** — El login no guarda el usuario. El backend devuelve `"usuario"`, pero `Login.jsx` lee `data.user`, así que `localStorage.user` nunca se llena. El Dashboard además lee `.firstname`, por eso siempre saluda "Hola, Usuario". El rol no se devuelve ni va en el token.

**P1-3** — Datos simulados.
- Dashboard: `ChildSwitcher`, `WeeklySummary`, `TimelineSection`, `ActivitiesSection` y `ComparisonSection` tienen fijo a "Sofía" con textos inventados.
- Historial: `ChartCard` es un SVG estático y la alerta solo aparece si el niño se llama 'Sofia'.
- Sidebar: los botones Niños, Reportes y Configuración no navegan.
- Solo `SessionsList`, `StatCards`, `SummaryCard` y `HistoryChildBar` usan datos reales.

**P1-4** — El prompt contradice el encuadre ético. Pide actuar como "experto en psicología infantil" y dar "observaciones clínicas y recomendaciones". Tampoco exige explicitar los rasgos gráficos en que se apoya (color, trazo, tamaño, disposición, omisiones).

**P1-5** — Falta el modo "sin contexto / con contexto". Los resultados académicos se basan en procesar cada dibujo dos veces y comparar las dos lecturas, y el código no lo permite.

**P2-1** — Las variables del formulario no coinciden con los documentos, que hablan de composición del hogar, estado emocional previo en escala de 5 niveles y rol del adulto. La edad admite de 2 a 17 años, pero el proyecto define de 4 a 12.

**P2-2** — Datos sensibles: se guardan el nombre del niño y un diagnóstico previo en texto libre. Conviene minimizarlos, por ejemplo con un alias.

**P2-3** — En Ollama la etiqueta oficial del modelo es `llama3.2-vision`, sin guion entre llama y 3.2.

**P2-4** — Sobrantes:
- `middleware/` duplicado.
- `authRoutes.js` vacío.
- Paquete llamado `proyecto-ollama`.
- `frontend/README.md` era la plantilla de Vite (ya reemplazado, remite al README principal).
- El proxy de `vite.config.js` no sirve, porque `api.js` usa la URL absoluta.

**P2-5** — Seguridad:
- CORS abierto a cualquier origen.
- Multer sin límite de tamaño ni validación de tipo.
- JWT guardado en `localStorage`.
- `dns.setServers` forzado en `server.js`.

**P2-6** — No hay tests, y el backend no tiene scripts `start` ni `dev`.

**P2-7** — `node_modules` quedó en commits antiguos. Es solo informativo: NO reescribas el historial.

## 3. Reglas de trabajo

- Responde y documenta en español.
- Trabaja en la rama `feature/actualizacion-funciones`. Nunca hagas push directo a `main`.
- Commits pequeños, con mensajes en español en imperativo. Muestra el diff antes de cada commit y espera aprobación explícita. No avances de paso del plan sin confirmación.
- Pide confirmación ANTES de: borrar datos o archivos versionados, cambiar el esquema de MongoDB, reescribir historial (filter-repo, rebase de commits publicados, push --force) o cambiar de proveedor de IA.
- Nunca escribas secretos reales; usa valores de ejemplo en `.env.example`.
- No inventes funcionalidades. Si algo es simulado o está pendiente, dilo.
- Nada de lenguaje diagnóstico ni clínico en la UI, los prompts ni la documentación. La app es un apoyo orientativo, no reemplaza el criterio profesional.
- Referencia visual del diseño objetivo: `docs/MOCKUPS.pdf` (capturas de la app; **no se versiona**, tiene un correo personal visible y una imagen de terceros — está en `.gitignore`).

**Entorno de desarrollo (esta máquina):**
- No hay Ollama instalado aquí y no se puede instalar. No intentes ejecutar el análisis de imágenes en este entorno.
- Verificación disponible aquí: `npm test` (backend) en la carpeta del proyecto; `npm run lint`, `npm test` y `npm run build` en `frontend/`; y `node --check <archivo>` para los archivos del backend.
- Las pruebas reales con Ollama (modelo `minicpm-v`) se hacen en otro equipo, después del push. Al terminar cada paso, indicar exactamente qué probar allá, con qué usuarios de prueba y qué resultado esperar.
- Si algo no se puede verificar en esta máquina, decirlo explícitamente en vez de asumir que funciona.
- MongoDB Atlas a veces falla aquí con `querySrv EREFUSED` (DNS intermitente de WSL): anteponer `DNS_SERVERS=8.8.8.8,1.1.1.1` al comando.

## 4. Plan de trabajo

> Última actualización: 2026-09-29. Este plan reemplaza cualquier versión anterior. Cada paso se implementa, se muestra su diff y se espera confirmación antes de seguir con el siguiente.

**Estado:**
- P0-1 resuelto (commit `3f79f41`): `Analyzer.jsx` ya renderiza.
- P0-2 resuelto (commit `b9d4ce4`): `uploads/` ya no se versiona. Eran imágenes de prueba de internet.
- Los análisis que hoy existen en MongoDB son datos de prueba; no interesa conservarlos (ver migración en el Paso 4).

### Paso 0 — Mockups y CLAUDE.md
- Mover el PDF de mockups a `docs/MOCKUPS.pdf`, ignorarlo en git (correo personal visible + imagen de terceros) y usarlo como referencia visual del resto del plan.
- Marcar P0-1 y P0-2 como resueltos en este archivo (hecho arriba) y reemplazar el plan viejo por este.

### Paso 1 — Rutas de subida y usuario en el login (P1-1, P1-2)
- Usar `path.join(__dirname, "uploads")` en Multer y en toda lectura de imágenes. Crear la carpeta si no existe.
- El login debe devolver el rol y debe incluirlo en el JWT.
- El frontend debe guardar el usuario con la clave correcta (hoy lee `data.user`, pero el backend envía `usuario`) y el Dashboard debe mostrar el nombre real (hoy lee `.firstname`, que no existe).

### Paso 2 — Prompt de análisis exhaustivo (P1-4)
El análisis debe seguir siendo exhaustivo y detallado; priorizar calidad sobre velocidad, no acortarlo.

- Parámetros de Ollama: `num_predict: 4000`, `num_ctx: 8192` (verificar que `minicpm-v` lo soporte; si no, usar el máximo soportado y documentarlo aquí). Sin timeout corto en la llamada del backend a Ollama: el análisis puede tardar varios minutos.
- Estructura de salida (JSON): `rasgos_observados` (lista SOLO de lo visible: colores, trazos y presión aparente, figuras, tamaño, disposición en la hoja, omisiones), `interpretacion` (texto extenso que relacione cada rasgo con el contexto del niño), `emocion_predominante`, `intensidad` (baja | media | alta), `lectura_orientativa` (síntesis para el adulto, con sugerencias de acompañamiento).
- Instrucciones al modelo: no mencionar elementos que no aparezcan en el dibujo (alucinó insectos en el Mockup 4), lenguaje orientativo ("podría sugerir"), nunca clínico ("el niño padece"), quitar "actúa como experto en psicología infantil" y "observaciones clínicas".
- Robustez: si el JSON llega incompleto o mal formado, intentar recuperar el texto, guardar lo que se pueda y avisar en la respuesta. No fallar en silencio.
- Frontend: mostrar `rasgos_observados` como lista, renombrar "Análisis psicológico detallado" a "Lectura orientativa", mensaje de espera claro ("El análisis puede tardar varios minutos. No cierres esta ventana.").

### Paso 3 — Análisis sin contexto / con contexto (P1-5)
Opción para procesar el mismo dibujo dos veces (sin contexto y con contexto), guardar ambos resultados vinculados y mostrarlos lado a lado. Es la base académica del proyecto. Avisar al usuario que toma el doble de tiempo.

### Paso 4 — Niños, autorización del representante legal y acceso compartido (bloque grande)
Antes de escribir código: proponer el diseño completo (modelos, endpoints, pantallas, migración) y esperar aprobación. Luego implementar en varios commits.

Principio: cualquier usuario (padre, profesor o psicólogo) puede crear niños. No se puede analizar a un niño hasta tener una autorización vigente de su representante legal. El representante NO necesita cuenta ni correo.

**Modelos:**
- `Nino`: alias (no nombre completo), edad o fechaNacimiento (rango 4 a 12), responsableId (usuario que lo creó), estado (`activo` | `pendiente_autorizacion`), fechas.
- `Autorizacion` (una vigente por niño, con historial): ninoId, registradaPor (usuarioId), metodo (`representante_es_usuario` | `firma_en_pantalla` | `documento_fisico` | `enlace_remoto`), nombreRepresentante, parentesco, contactoOpcional (teléfono o correo, no obligatorio), evidencia según el método (firma PNG, foto del documento, o datos de aceptación remota: fecha y hora, medio de entrega, IP, user-agent), versionTexto, finalidades (`["analisis", "compartir_con_otros_usuarios"]`), estado (`vigente` | `revocada` | `rechazada`), fechaAceptacion, fechaRevocacion.
- `SolicitudAutorizacion` (para `enlace_remoto`): ninoId, solicitadaPor, tokenHash, medio (`correo` | `enlace_copiado`), correoDestino opcional, expiraEn, usadaEn, estado (`pendiente` | `aceptada` | `rechazada` | `vencida` | `cancelada`).
- `Acceso`: ninoId, usuarioId (otro usuario registrado), otorgadoPor, estado (`activo` | `revocado`), fechas.
- `Analysis`: agregar ninoId y creadoPor. Quitar el nombre de `contexto_nino`.

**Los 4 métodos de autorización:**
1. "Soy el representante legal": el usuario lo declara, lee el texto y marca el checkbox.
2. "Firma en pantalla": el representante está presente, lee el texto en el dispositivo, escribe nombre y parentesco y firma en un canvas (mouse o dedo). Debe funcionar en celular.
3. "Documento físico": se sube la foto del consentimiento firmado en papel, más el nombre y parentesco del representante.
4. "Enlace remoto": se genera un enlace para que el representante acepte desde su propio dispositivo.
   - Token aleatorio de 32 bytes, de un solo uso, que vence en 7 días. En la base de datos solo se guarda el hash.
   - Entrega: (a) por correo, si se ingresó uno; (b) botón "Copiar enlace" para compartirlo por WhatsApp o SMS (siempre disponible, no requiere correo).
   - Página pública `/autorizar/:token`, sin login: muestra solo el alias del niño, quién solicita y el texto vigente (nunca dibujos ni análisis); el representante confirma nombre y parentesco y elige "Acepto" o "No acepto"; si acepta se crea la `Autorizacion` y el niño pasa a `activo`; si rechaza se registra el rechazo; token vencido o usado muestra un mensaje claro y opción de pedir uno nuevo desde la app; rate limit en esta ruta.
   - Correo: `nodemailer` con SMTP configurable en `.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `APP_URL`). `EMAIL_MODE=console` por defecto (no envía nada, muestra el enlace en la consola del backend). Agregar estas variables a `.env.example`. El correo debe ser corto, en español claro, decir quién lo envía y para qué, y que puede ignorarse si no reconoce la solicitud.

**Reglas (todas validadas en el backend):**
- El responsable ve y analiza al niño, comparte o revoca acceso a otros usuarios registrados (buscándolos por su correo de registro), y puede borrar al niño con todos sus análisis, imágenes y evidencias.
- Un usuario con `Acceso` activo ve y crea análisis de ese niño, pero no puede compartirlo ni borrarlo.
- Sin `Autorizacion` vigente no se crean análisis.
- Al registrar una revocación, preguntar si también se borran los datos del niño.
- Vista inicial por rol: padre y profesor entran al Dashboard; psicólogo entra al Historial.

**Archivos protegidos:**
- Quitar el `express.static` público de `/uploads`.
- `GET /analisis/:id/imagen` y `GET /autorizaciones/:id/evidencia` con `verificarToken`, validando que el usuario es el responsable o tiene `Acceso` activo.
- El frontend los carga con el token (`fetch` → blob → `URL.createObjectURL`).
- Evidencias en `backend/uploads/evidencias/` (ignorado por git).
- Al borrar un niño se borran sus imágenes y evidencias del disco.

**Pantallas:**
- "Mis niños" (conecta el botón "Niños" del sidebar y "Agregar niño" de los mockups): mis niños y los compartidos conmigo, con el estado de su autorización.
- Crear niño → paso de autorización con los 4 métodos.
- Solicitudes remotas: ver estado (pendiente, aceptada, rechazada, vencida), reenviar, copiar enlace nuevo, cancelar.
- Compartir: buscar usuario por correo, dar y revocar acceso.
- Analyzer: elegir el niño antes del contexto. Bloquear si no tiene autorización vigente.
- Historial: seleccionar niño → línea de tiempo por fecha → al abrir un día, mostrar el dibujo y su análisis completo.

**Textos** (borrador, en archivos aparte en `docs/legal/`, para revisión del equipo y el asesor; sin presentarlos como texto legal definitivo; `docs/legal/` SÍ se versiona en git):
- Autorización del representante legal, versión 1, en lenguaje claro para padres: para qué se usan los dibujos, que se procesan en un servidor local, quién puede verlos, que es revocable y cómo pedir el borrado. Mencionar la Ley 1581 de 2012.
- Términos y Condiciones, y Política de Privacidad, como páginas simples enlazadas desde el registro (hoy el checkbox del registro enlaza a páginas que no existen). Incluir que quien registra una autorización declara haberla obtenido del representante legal y responde por ello.

**Migración:** los análisis actuales son de prueba. Proponer borrarlos (análisis en MongoDB e imágenes en `backend/uploads`) antes de activar los nuevos modelos. Preguntar antes de ejecutar.

### Paso 5 — Dashboard e historial con datos reales (P1-3)
- Reemplazar los datos fijos de "María", "Sofía" y "Lucas" (`ChildSwitcher`, `WeeklySummary`, `TimelineSection`, `ComparisonSection`) por datos reales del niño seleccionado.
- `ChartCard`: gráfica real de las emociones del niño en el tiempo. Hoy es un SVG fijo que contradice los datos de la misma pantalla.
- Quitar la alerta que solo sale si el niño se llama 'Sofia'. Si hay alerta, que sea por una regla clara y documentada, con lenguaje orientativo.
- "Antes y ahora": comparar dos análisis reales del mismo niño (imagen, emoción y rasgos).
- Actividades sugeridas: catálogo fijo por emoción en un JSON revisable, NO generado por IA. Guardar el estado de "hecho".

### Paso 6 — Botones y textos
- "Contactar especialista", "Exportar PDF", "3 meses", "Reportes" y "Configuración": implementarlos o deshabilitarlos con un tooltip "Próximamente".
- Cambiar "SIGN IN" / "SIGN UP" por "Iniciar sesión" / "Crear cuenta".

### Paso 7 — Limpieza (P2)
- Arreglar los 41 errores de lint.
- Eliminar `middleware/` duplicado y `routes/authRoutes.js` vacío.
- Renombrar el paquete `proyecto-ollama`.
- Corregir el modelo de `/preguntar` (`llama3.2-vision`) o eliminar la ruta si no se usa.
- Agregar scripts `start` y `dev` al backend.
- Multer: límite de tamaño y solo JPG, PNG o WEBP.
- Restringir CORS al origen del frontend.
- Revisar si `dns.setServers` sigue siendo necesario.
- Quitar el proxy inútil de `vite.config.js` o usar la URL relativa.
- Actualizar el README con todo lo implementado.
