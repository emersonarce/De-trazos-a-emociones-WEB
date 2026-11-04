const express = require("express");
const multer = require("multer");
const { recortarCuadradoAJpeg } = require("../utils/imagen");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const verificarToken = require("../middleware/authMiddleware");
const { validarPassword } = require("../utils/password");
const { permisosEfectivos } = require("../utils/permisos");

const router = express.Router();

// Carpeta de subidas del backend (routes/ está un nivel por debajo).
const uploadsDir = path.join(__dirname, "..", "uploads");
const perfilesDir = path.join(uploadsDir, "perfiles");
if (!fs.existsSync(perfilesDir)) {
    fs.mkdirSync(perfilesDir, { recursive: true });
}

// La foto se procesa en memoria (utils/imagen.js), por eso se usa memoryStorage.
const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (TIPOS_IMAGEN.includes(file.mimetype)) cb(null, true);
        else cb(new Error("Formato no permitido. Usa JPG, PNG o WEBP."));
    }
});

/*
========================================
DATOS DEL USUARIO AUTENTICADO
GET /perfil/me
========================================
*/

router.get("/me", verificarToken, async (req, res) => {
    try {
        const usuario = await User.findById(req.usuario.id)
            .select("nombre apellido email rol institucion estado esAdmin fotoPerfil permisos");

        if (!usuario) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Cuenta eliminada con una sesión aún abierta (p. ej. en otro equipo):
        // el 401 hace que la app cierre la sesión.
        if (usuario.estado === "eliminado") {
            return res.status(401).json({ message: "Esta cuenta fue eliminada" });
        }

        return res.json({
            id: usuario._id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            rol: usuario.rol,
            institucion: usuario.institucion,
            esAdmin: usuario.esAdmin,
            permisos: permisosEfectivos(usuario),
            tieneFoto: Boolean(usuario.fotoPerfil)
        });
    } catch (error) {
        console.error("Error al obtener el perfil:", error);
        return res.status(500).json({ message: "Error al obtener el perfil" });
    }
});

/*
========================================
SUBIR / ACTUALIZAR FOTO DE PERFIL
POST /perfil/foto   (multipart, campo "foto")
========================================
*/

router.post("/foto", verificarToken, upload.single("foto"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No se recibió ninguna imagen" });
        }

        const nombreArchivo = `${req.usuario.id}.jpg`;
        const destino = path.join(perfilesDir, nombreArchivo);

        await recortarCuadradoAJpeg(req.file.buffer, destino, { lado: 256, calidad: 82 });

        await User.findByIdAndUpdate(req.usuario.id, {
            fotoPerfil: `/uploads/perfiles/${nombreArchivo}`
        });

        return res.json({ message: "Foto actualizada" });
    } catch (error) {
        console.error("Error al subir la foto:", error);
        return res.status(500).json({ message: "Error al subir la foto" });
    }
});

/*
========================================
SERVIR LA FOTO DEL USUARIO AUTENTICADO
GET /perfil/foto
========================================
*/

router.get("/foto", verificarToken, async (req, res) => {
    try {
        const usuario = await User.findById(req.usuario.id).select("fotoPerfil");

        if (!usuario || !usuario.fotoPerfil) {
            return res.status(404).json({ message: "Sin foto" });
        }

        const rutaFisica = path.join(perfilesDir, path.basename(usuario.fotoPerfil));
        if (!fs.existsSync(rutaFisica)) {
            return res.status(404).json({ message: "Sin foto" });
        }

        return res.sendFile(rutaFisica);
    } catch (error) {
        console.error("Error al obtener la foto:", error);
        return res.status(500).json({ message: "Error al obtener la foto" });
    }
});

/*
========================================
CAMBIAR CONTRASEÑA
POST /perfil/cambiar-password   body: { actual, nueva }
========================================
*/

router.post("/cambiar-password", verificarToken, async (req, res) => {
    try {
        const { actual, nueva } = req.body;

        if (!actual || !nueva) {
            return res.status(400).json({ message: "Debes indicar la contraseña actual y la nueva" });
        }
        const errorPassword = validarPassword(nueva);
        if (errorPassword) {
            return res.status(400).json({ message: errorPassword });
        }

        const usuario = await User.findById(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const passwordValida = await bcrypt.compare(actual, usuario.password);
        if (!passwordValida) {
            return res.status(400).json({ message: "La contraseña actual no es correcta" });
        }

        usuario.password = await bcrypt.hash(nueva, 12);
        await usuario.save();

        return res.json({ message: "Contraseña actualizada" });
    } catch (error) {
        console.error("Error cambiando la contraseña:", error);
        return res.status(500).json({ message: "Error al cambiar la contraseña" });
    }
});

/*
========================================
ELIMINAR LA CUENTA (QUEDA DESACTIVADA)
DELETE /perfil
Solo con el permiso eliminarCuenta, que asigna el administrador. La cuenta no
se borra: queda con estado "eliminado", con todos sus datos, y ya no puede
iniciar sesión. El administrador la ve en «Cuentas eliminadas» y decide si la
restaura o la elimina definitivamente (DELETE /admin/usuarios/:id).
========================================
*/

router.delete("/", verificarToken, async (req, res) => {
    try {
        const usuario = await User.findById(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        if (usuario.esAdmin) {
            return res.status(400).json({ message: "Un administrador no puede eliminar su propia cuenta" });
        }

        if (!permisosEfectivos(usuario).eliminarCuenta) {
            return res.status(403).json({
                message: "No tienes permiso para eliminar tu cuenta. Pídeselo al administrador."
            });
        }

        usuario.estado = "eliminado";
        usuario.eliminadoEn = new Date();
        await usuario.save();

        return res.json({ message: "Cuenta eliminada" });
    } catch (error) {
        console.error("Error al eliminar la cuenta:", error);
        return res.status(500).json({ message: "Error al eliminar la cuenta" });
    }
});

module.exports = router;
