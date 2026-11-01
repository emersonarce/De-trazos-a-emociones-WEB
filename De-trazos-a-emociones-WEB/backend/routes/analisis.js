// Rutas del análisis de dibujos: analizar, historial, guardar, asignar,
// reanalizar, imagen protegida y borrado. La lógica de IA vive en services/ia.
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { reducirAJpeg } = require("../utils/imagen");
const { obtenerAnalisisIA, construirContextoFinal } = require("../services/ia");
const { sanitizarContexto } = require("../services/ia/contexto");
const { medirImagen } = require("../services/medicionImagen");
const Analysis = require("../models/Analysis");
const User = require("../models/User");
const { permisosEfectivos } = require("../utils/permisos");
const verificarToken = require("../middleware/authMiddleware");

const router = express.Router();

// Carpeta de subidas del backend (routes/ está un nivel por debajo).
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Solo imágenes JPG, PNG o WEBP, máximo 8 MB.
const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];
const upload = multer({
    dest: uploadsDir,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (TIPOS_IMAGEN.includes(file.mimetype)) cb(null, true);
        else cb(new Error("Formato no permitido. Usa JPG, PNG o WEBP."));
    }
});

/* =========================
   ANALISIS DE IMAGEN CON CONTEXTO
========================= */

router.post(
    "/analizar-imagen",
    verificarToken,
    upload.single("imagen"),
    async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No se envió ninguna imagen" });
    }

    // Permiso: analizar CON contexto (persistir != "false") requiere el permiso
    // "conContexto". El modo "solo dibujo" lo puede usar cualquier cuenta aprobada.
    if (req.body.persistir !== "false") {
        try {
            const usuarioActual = await User.findById(req.usuario.id).select("esAdmin permisos");
            if (!permisosEfectivos(usuarioActual).conContexto) {
                fs.unlink(req.file.path, () => {}); // no dejar la subida huérfana
                return res.status(403).json({
                    error: "Tu cuenta solo puede analizar dibujos sueltos. Pídele al administrador que te habilite el análisis con contexto."
                });
            }
        } catch {
            fs.unlink(req.file.path, () => {});
            return res.status(500).json({ error: "Error verificando permisos" });
        }
    }

    const {
        nombre,
        edad,
        fecha_nacimiento,
        genero,
        situacion_actual,
        comportamiento,
        diagnostico_previo,
        dibujo_espontaneo,
        comento_mientras,
        tiempo_dibujo,
        descripcion_dibujo
    } = req.body;

    // En modo "solo dibujo" el body no trae contexto, así que esto queda vacío.
    const contextoFinal = construirContextoFinal(req.body);

    const processedImagePath = req.file.path + "-resized.jpg";
    try {
        // Redimensionar y comprimir la imagen para que el modelo la procese más rápido.
        await reducirAJpeg(req.file.path, processedImagePath, { max: 800, calidad: 80 });

        // Medición de color y trazo sobre la imagen (sin IA); si falla, sigue sin ella.
        const medicion = await medirImagen(processedImagePath);

        const imagenBase64 = fs.readFileSync(processedImagePath, { encoding: "base64" });
        const { resultado: resultadoJSON, aviso: avisoParseo } = await obtenerAnalisisIA(imagenBase64, contextoFinal);
        if (medicion && resultadoJSON && typeof resultadoJSON === "object") resultadoJSON.medicion_imagen = medicion;

        // Eliminar solo el archivo original temporal, nos quedamos con el resized.
        fs.unlinkSync(req.file.path);
        const rutaImagenGuardada = "/uploads/" + path.basename(processedImagePath);

        // Modo "solo dibujo": no se guarda de una; el usuario decide después.
        if (req.body.persistir === "false") {
            return res.json({
                analisis: resultadoJSON,
                imagen: rutaImagenGuardada,
                guardado: false,
                simulado: resultadoJSON.simulado === true,
                aviso: avisoParseo
            });
        }

        const nuevoAnalisis = new Analysis({
            usuarioId: req.usuario.id,
            contexto_nino: {
                nombre, edad, fecha_nacimiento, genero,
                situacion_actual, comportamiento, diagnostico_previo,
                dibujo_espontaneo, comento_mientras, tiempo_dibujo,
                descripcion_dibujo
            },
            ruta_imagen: rutaImagenGuardada,
            resultado_ia: resultadoJSON,
            analizado_sin_contexto: false
        });

        await nuevoAnalisis.save();

        res.json({
            analisis: resultadoJSON,
            id: nuevoAnalisis._id,
            imagen: rutaImagenGuardada,
            guardado: true,
            simulado: resultadoJSON.simulado === true,
            aviso: avisoParseo
        });

    } catch (error) {
        // Si algo falló (p. ej. Ollama apagado), no dejar archivos temporales.
        fs.unlink(req.file.path, () => {});
        fs.unlink(processedImagePath, () => {});
        console.error("Error analizando el dibujo:", error.message);
        res.status(500).json({ error: error.message });
    }
});

/* =========================
   HISTORIAL DE ANÁLISIS
========================= */

router.get("/analisis", verificarToken, async (req, res) => {
    try {
        const historial = await Analysis.find({
            usuarioId: req.usuario.id
        }).sort({ fecha: -1 });

        res.json(historial);

    } catch (error) {
        console.error("Error obteniendo historial:", error);

        res.status(500).json({
            error: "Error obteniendo el historial"
        });
    }
});

/* =========================
   GUARDAR UN ANÁLISIS YA HECHO (modo "solo dibujo")
========================= */

router.post("/analisis/guardar", verificarToken, async (req, res) => {
    const { analisis, imagen, independiente, contexto_nino } = req.body;

    if (!analisis || !imagen) {
        return res.status(400).json({ error: "Faltan datos del análisis" });
    }

    // Por seguridad, solo el nombre del archivo, y debe existir en uploads.
    const nombreArchivo = path.basename(String(imagen));
    const rutaFisica = path.join(uploadsDir, nombreArchivo);
    if (!fs.existsSync(rutaFisica)) {
        return res.status(404).json({ error: "La imagen ya no está disponible" });
    }

    try {
        const nuevo = new Analysis({
            usuarioId: req.usuario.id,
            // Un dibujo suelto solo conserva su descripción (si la tuvo).
            contexto_nino: independiente
                ? (contexto_nino?.descripcion_dibujo ? { descripcion_dibujo: contexto_nino.descripcion_dibujo } : {})
                : (contexto_nino || {}),
            ruta_imagen: "/uploads/" + nombreArchivo,
            resultado_ia: analisis,
            independiente: !!independiente,
            // Se guarda desde el modo "solo dibujo": el análisis se hizo sin contexto.
            analizado_sin_contexto: true
        });

        await nuevo.save();
        res.json({ id: nuevo._id, guardado: true });

    } catch (error) {
        console.error("Error guardando el análisis:", error);
        res.status(500).json({ error: "Error guardando el análisis" });
    }
});

/* =========================
   DESCARTAR UN ANÁLISIS NO GUARDADO (borra la imagen temporal)
========================= */

router.post("/analisis/descartar", verificarToken, (req, res) => {
    const { imagen } = req.body;
    if (imagen) {
        const rutaFisica = path.join(uploadsDir, path.basename(String(imagen)));
        fs.unlink(rutaFisica, () => {});
    }
    res.json({ ok: true });
});

/* =========================
   ASIGNAR UN DIBUJO INDEPENDIENTE A UN NIÑO
========================= */

router.patch("/analisis/:id/asignar", verificarToken, async (req, res) => {
    const { id } = req.params;
    const { contexto_nino } = req.body;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.status(400).json({ error: "Identificador inválido" });
    }
    if (!contexto_nino || !contexto_nino.nombre) {
        return res.status(400).json({ error: "Falta el niño al que asignar" });
    }

    try {
        const analisis = await Analysis.findOne({ _id: id, usuarioId: req.usuario.id });
        if (!analisis) {
            return res.status(404).json({ error: "Análisis no encontrado" });
        }

        analisis.independiente = false;
        analisis.contexto_nino = {
            nombre: contexto_nino.nombre,
            edad: contexto_nino.edad,
            fecha_nacimiento: contexto_nino.fecha_nacimiento,
            genero: contexto_nino.genero,
            // La descripción del dibujo (si la tenía) se conserva al asignarlo.
            descripcion_dibujo: analisis.contexto_nino?.descripcion_dibujo
        };
        // Sigue siendo un análisis hecho sin contexto hasta que se reanalice.
        analisis.analizado_sin_contexto = true;

        await analisis.save();
        res.json({ ok: true });

    } catch (error) {
        console.error("Error asignando el análisis:", error);
        res.status(500).json({ error: "Error asignando el análisis" });
    }
});

/* =========================
   DESASIGNAR UN DIBUJO (vuelve a la lista de independientes)
========================= */

router.patch("/analisis/:id/desasignar", verificarToken, async (req, res) => {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.status(400).json({ error: "Identificador inválido" });
    }

    try {
        const analisis = await Analysis.findOne({ _id: id, usuarioId: req.usuario.id });
        if (!analisis) {
            return res.status(404).json({ error: "Análisis no encontrado" });
        }

        analisis.independiente = true;
        // Se quita el niño, pero la descripción del dibujo se conserva.
        const descripcion = analisis.contexto_nino?.descripcion_dibujo;
        analisis.contexto_nino = descripcion ? { descripcion_dibujo: descripcion } : {};
        analisis.analizado_sin_contexto = true;

        await analisis.save();
        res.json({ ok: true });

    } catch (error) {
        console.error("Error desasignando el análisis:", error);
        res.status(500).json({ error: "Error desasignando el análisis" });
    }
});

/* =========================
   REANALIZAR UN DIBUJO YA GUARDADO, AHORA CON CONTEXTO
========================= */

// Body opcional: { contexto_nino } con el contexto revisado o editado por el
// usuario antes de reanalizar. Se guarda en el análisis junto al nuevo resultado.
router.post("/analisis/:id/reanalizar", verificarToken, async (req, res) => {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.status(400).json({ error: "Identificador inválido" });
    }

    try {
        // Reanalizar es analizar CON contexto: requiere el mismo permiso.
        const usuarioActual = await User.findById(req.usuario.id).select("esAdmin permisos");
        if (!permisosEfectivos(usuarioActual).conContexto) {
            return res.status(403).json({
                error: "Tu cuenta no tiene habilitado el análisis con contexto. Pídele al administrador que te lo habilite."
            });
        }

        const analisis = await Analysis.findOne({ _id: id, usuarioId: req.usuario.id });
        if (!analisis || !analisis.ruta_imagen) {
            return res.status(404).json({ error: "Análisis no encontrado" });
        }

        const rutaFisica = path.join(uploadsDir, path.basename(analisis.ruta_imagen));
        if (!fs.existsSync(rutaFisica)) {
            return res.status(404).json({ error: "La imagen ya no está disponible" });
        }

        const cambios = sanitizarContexto((req.body || {}).contexto_nino);
        const contexto = { ...(analisis.toObject().contexto_nino || {}), ...(cambios || {}) };
        const contextoFinal = construirContextoFinal(contexto);
        const medicion = await medirImagen(rutaFisica);
        const imagenBase64 = fs.readFileSync(rutaFisica, { encoding: "base64" });
        const { resultado, aviso } = await obtenerAnalisisIA(imagenBase64, contextoFinal);
        if (medicion && resultado && typeof resultado === "object") resultado.medicion_imagen = medicion;

        analisis.contexto_nino = contexto;
        analisis.resultado_ia = resultado;
        analisis.analizado_sin_contexto = false;
        await analisis.save();

        res.json({ analisis: resultado, contexto_nino: contexto, aviso, simulado: resultado.simulado === true });

    } catch (error) {
        console.error("Error reanalizando:", error);
        res.status(500).json({ error: "Error reanalizando el dibujo" });
    }
});

/* =========================
   IMAGEN PROTEGIDA DE UN ANÁLISIS
========================= */

router.get("/analisis/:id/imagen", verificarToken, async (req, res) => {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.status(400).json({ error: "Identificador inválido" });
    }

    try {
        // Solo el dueño del análisis puede ver su imagen.
        const analisis = await Analysis.findOne({ _id: id, usuarioId: req.usuario.id });

        if (!analisis || !analisis.ruta_imagen) {
            return res.status(404).json({ error: "Imagen no encontrada" });
        }

        const rutaFisica = path.join(uploadsDir, path.basename(analisis.ruta_imagen));

        if (!fs.existsSync(rutaFisica)) {
            return res.status(404).json({ error: "Imagen no encontrada" });
        }

        res.sendFile(rutaFisica);

    } catch (error) {
        console.error("Error obteniendo la imagen:", error);
        res.status(500).json({ error: "Error obteniendo la imagen" });
    }
});

/* =========================
   BORRAR VARIOS ANÁLISIS (p. ej. todos los de un niño)
========================= */

router.post("/analisis/eliminar-varios", verificarToken, async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "Debes enviar una lista de ids" });
    }

    const validos = ids.filter((id) => /^[0-9a-fA-F]{24}$/.test(id));
    if (validos.length === 0) {
        return res.status(400).json({ error: "No hay identificadores válidos" });
    }

    try {
        // Solo análisis propios.
        const analisis = await Analysis.find({ _id: { $in: validos }, usuarioId: req.usuario.id });

        for (const a of analisis) {
            if (a.ruta_imagen) {
                const rutaFisica = path.join(uploadsDir, path.basename(a.ruta_imagen));
                fs.unlink(rutaFisica, () => {});
            }
        }

        const result = await Analysis.deleteMany({
            _id: { $in: analisis.map((a) => a._id) },
            usuarioId: req.usuario.id
        });

        res.json({ eliminados: result.deletedCount });

    } catch (error) {
        console.error("Error eliminando análisis:", error);
        res.status(500).json({ error: "Error eliminando los análisis" });
    }
});

/* =========================
   BORRAR UN ANÁLISIS
========================= */

router.delete("/analisis/:id", verificarToken, async (req, res) => {
    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.status(400).json({ error: "Identificador inválido" });
    }

    try {
        // Solo se puede borrar un análisis propio.
        const analisis = await Analysis.findOne({ _id: id, usuarioId: req.usuario.id });

        if (!analisis) {
            return res.status(404).json({ error: "Análisis no encontrado" });
        }

        // Borrar la imagen del disco si existe (ignora el error si ya no está).
        if (analisis.ruta_imagen) {
            const rutaFisica = path.join(uploadsDir, path.basename(analisis.ruta_imagen));
            fs.unlink(rutaFisica, () => {});
        }

        await Analysis.deleteOne({ _id: analisis._id });

        res.json({ mensaje: "Análisis eliminado" });

    } catch (error) {
        console.error("Error eliminando análisis:", error);
        res.status(500).json({ error: "Error eliminando el análisis" });
    }
});

module.exports = router;
