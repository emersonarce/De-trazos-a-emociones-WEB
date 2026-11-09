# Checklist de pruebas — Pasos 0, 1, 2 y 2.5

Marca cada casilla cuando el resultado coincida con lo esperado. Si algo falla, anótalo y avísame antes de seguir al Paso 3.

Rama: `feature/actualizacion-funciones`. Haz `git pull` antes de empezar.

---

## En este PC (AI_MODE=mock, sin Ollama)

Requiere solo Node.js y una conexión a MongoDB (Atlas). Configura `backend/.env` con `AI_MODE=mock` (ver instrucciones de arranque abajo).

### Arranque y sesión
- [ ] El backend arranca sin errores y muestra "MongoDB Conectado" y "Servidor iniciado en puerto 3000". **Esperado:** no aparece ningún error de `MONGO_URI` ni de conexión.
- [ ] El frontend arranca con `npm run dev` y abre en `http://localhost:5173`.
- [ ] Antes de probar, borra el Local Storage (o cierra sesión). **Motivo:** los tokens viejos no traen el rol.

### Paso 1 — Login y usuario
- [ ] Registro de un usuario nuevo (rol `padre`) funciona y redirige al login. **Esperado:** mensaje "Usuario registrado correctamente".
- [ ] Inicio de sesión funciona y entra a `/app`.
- [ ] En DevTools → Application → Local Storage, la clave `user` contiene `{ id, nombre, email, rol }`. **Esperado:** el objeto NO está vacío y trae `rol`.
- [ ] En `/dashboard`, el saludo dice "Hola, `<tu nombre real>`". **Esperado:** ya no dice "Hola, Usuario".

### Paso 0 — Estructura (verificación rápida)
- [ ] Existe `README.md` y `CLAUDE.md` en la raíz del repo. **Esperado:** el README describe el stack real con Ollama.
- [ ] `docs/MOCKUPS.pdf` NO aparece en `git status` (está ignorado). **Esperado:** `git status --porcelain` no lo lista.

### Paso 2 + 2.5 — Análisis simulado
- [ ] En `/app`, completa el contexto (paso 1), sube una imagen cualquiera (paso 2) y pulsa "Analizar emociones".
- [ ] Mientras procesa, aparece el mensaje "El análisis puede tardar varios minutos. No cierres esta ventana."
- [ ] El resultado llega en ~2-3 segundos. **Esperado:** no se cuelga ni da error.
- [ ] Arriba del resultado aparece el aviso "Resultado simulado (modo de prueba)".
- [ ] El resultado muestra las secciones **Rasgos observados** (lista), **Interpretación** y **Lectura orientativa**. **Esperado:** el título es "Lectura orientativa", no "Análisis psicológico detallado".
- [ ] La imagen subida se guardó en `De-trazos-a-emociones-WEB/backend/uploads/`. **Esperado:** aparece un archivo nuevo `-resized.jpg` ahí.
- [ ] En `/historial`, el análisis recién creado se ve con su emoción (Alegría) e intensidad (Media) correctas en el registro de sesiones.
- [ ] Rutas independientes del directorio: detén el backend y arráncalo desde otra carpeta (p. ej. la raíz del repo: `node De-trazos-a-emociones-WEB/backend/server.js`). Repite un análisis. **Esperado:** funciona igual y la imagen cae en `backend/uploads/`.

---

## En el PC con Ollama (AI_MODE=ollama)

Requiere Ollama corriendo con el modelo `minicpm-v`. Usa `backend/.env` con `AI_MODE=ollama` (o sin la variable).

### Preparación
- [ ] `ollama --version` es **0.5.0 o superior**. **Si es menor:** pon `OLLAMA_FORMAT_MODE=json` en `backend/.env`.
- [ ] `ollama list` muestra `minicpm-v` descargado.
- [ ] Borra el Local Storage / cierra sesión y vuelve a entrar (por el rol en el token).

### Paso 2 — Análisis real
- [ ] Sube un dibujo y analiza. Aparece el mensaje de espera "El análisis puede tardar varios minutos…".
- [ ] Anota **cuánto tardó** el análisis: __________ (con `num_predict: 4000` puede ser varios minutos).
- [ ] El resultado **NO** muestra el aviso amarillo de "JSON incompleto". **Esperado:** el JSON llegó completo.
- [ ] Abre "Ver respuesta completa del modelo": el JSON está completo y bien formado, sin cortes al final.
- [ ] El resultado muestra **Rasgos observados**, **Interpretación** y **Lectura orientativa** con contenido real del dibujo.
- [ ] El lenguaje es orientativo ("podría sugerir", "parece"), **sin** frases clínicas ("el niño padece", "diagnóstico").
- [ ] El modelo **no inventa** elementos que no estén en el dibujo (revisa que lo descrito exista en la imagen).
- [ ] `num_ctx: 8192`: el backend no arroja error al llamar a Ollama. **Si falla por contexto:** avísame el valor máximo que soporte tu `minicpm-v`.

### Historial con datos reales
- [ ] En `/historial`, el análisis real aparece con la emoción e intensidad detectadas.
- [ ] Si tienes análisis viejos (formato `analisis_completo`), el historial no se rompe y sigue mostrando su emoción/intensidad.
