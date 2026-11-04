const express = require("express");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Analysis = require("../models/Analysis");
const verificarToken = require("../middleware/authMiddleware");
const verificarAdmin = require("../middleware/adminMiddleware");
const { permisosEfectivos } = require("../utils/permisos");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "uploads");
const perfilesDir = path.join(uploadsDir, "perfiles");

/*
========================================
LISTAR USUARIOS POR ESTADO
GET /admin/usuarios?estado=pendiente|aprobado|rechazado|eliminado
Por defecto devuelve los pendientes. Las eliminadas salen de la más reciente
a la más antigua según cuándo se eliminaron.
========================================
*/

router.get("/usuarios", verificarToken, verificarAdmin, async (req, res) => {
    try {
        const { estado } = req.query;

        const filtro = {};
        if (["pendiente", "aprobado", "rechazado", "eliminado"].includes(estado)) {
            filtro.estado = estado;
        } else {
            filtro.estado = "pendiente";
        }

        const usuarios = await User.find(filtro)
            .select("nombre apellido email rol institucion estado esAdmin permisos createdAt eliminadoEn")
            .sort(filtro.estado === "eliminado" ? { eliminadoEn: -1 } : { createdAt: -1 });

        // Se devuelven los permisos EFECTIVOS (admin = todo; cuentas heredadas =
        // acceso completo) para que el panel muestre el estado real.
        const conPermisos = usuarios.map((u) => ({
            _id: u._id,
            nombre: u.nombre,
            apellido: u.apellido,
            email: u.email,
            rol: u.rol,
            institucion: u.institucion,
            estado: u.estado,
            esAdmin: u.esAdmin,
            createdAt: u.createdAt,
            eliminadoEn: u.eliminadoEn,
            permisos: permisosEfectivos(u)
        }));

        return res.json(conPermisos);
    } catch (error) {
        console.error("Error listando usuarios:", error);
        return res.status(500).json({ message: "Error al obtener los usuarios" });
    }
});

/*
========================================
APROBAR, RECHAZAR O RESTAURAR UNA CUENTA
PATCH /admin/usuarios/:id   body: { accion: "aprobar" | "rechazar" | "restaurar" }
"restaurar" devuelve una cuenta eliminada por su usuario a "aprobado", con
todos sus datos. Una cuenta eliminada solo se restaura o se elimina
definitivamente (DELETE).
========================================
*/

router.patch("/usuarios/:id", verificarToken, verificarAdmin, async (req, res) => {
    try {
        const { accion } = req.body;
        const mapa = { aprobar: "aprobado", rechazar: "rechazado", restaurar: "aprobado" };
        const nuevoEstado = mapa[accion];

        if (!nuevoEstado) {
            return res.status(400).json({ message: "Acción no válida" });
        }

        const usuario = await User.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // No permitir cambiar el estado de un administrador.
        if (usuario.esAdmin) {
            return res.status(400).json({ message: "No se puede cambiar el estado de un administrador" });
        }

        const eliminada = usuario.estado === "eliminado";
        if (accion === "restaurar" && !eliminada) {
            return res.status(400).json({ message: "La cuenta no está eliminada" });
        }
        if (accion !== "restaurar" && eliminada) {
            return res.status(400).json({ message: "La cuenta está eliminada: restáurala o elimínala definitivamente" });
        }

        usuario.estado = nuevoEstado;
        usuario.eliminadoEn = undefined;
        await usuario.save();

        const mensajes = { aprobar: "Cuenta aprobada", rechazar: "Cuenta rechazada", restaurar: "Cuenta restaurada" };
        return res.json({
            message: mensajes[accion],
            id: usuario._id,
            estado: usuario.estado
        });
    } catch (error) {
        console.error("Error actualizando solicitud:", error);
        return res.status(500).json({ message: "Error al actualizar la solicitud" });
    }
});

/*
========================================
ELIMINAR UNA CUENTA Y SUS DATOS (DEFINITIVO)
DELETE /admin/usuarios/:id
También es el «Eliminar definitivamente» de las cuentas que su usuario
eliminó (estado "eliminado").
========================================
*/

router.delete("/usuarios/:id", verificarToken, verificarAdmin, async (req, res) => {
    try {
        const usuario = await User.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // No permitir eliminar administradores desde el panel.
        if (usuario.esAdmin) {
            return res.status(400).json({ message: "No se puede eliminar a un administrador" });
        }

        // Borrar las imágenes de sus análisis.
        const analisis = await Analysis.find({ usuarioId: usuario._id }).select("ruta_imagen");
        for (const a of analisis) {
            if (a.ruta_imagen) {
                fs.unlink(path.join(uploadsDir, path.basename(a.ruta_imagen)), () => {});
            }
        }
        await Analysis.deleteMany({ usuarioId: usuario._id });

        // Borrar su foto de perfil.
        if (usuario.fotoPerfil) {
            fs.unlink(path.join(perfilesDir, path.basename(usuario.fotoPerfil)), () => {});
        }

        await User.findByIdAndDelete(usuario._id);

        return res.json({ message: "Cuenta eliminada", id: usuario._id });
    } catch (error) {
        console.error("Error eliminando usuario:", error);
        return res.status(500).json({ message: "Error al eliminar la cuenta" });
    }
});

/*
========================================
GESTIONAR ROL, PERMISOS Y ADMIN DE UN USUARIO
PATCH /admin/usuarios/:id/gestion
body: { rol?, permisos?: { conContexto, descargarPdf, eliminarCuenta }, esAdmin? }
========================================
*/

router.patch("/usuarios/:id/gestion", verificarToken, verificarAdmin, async (req, res) => {
    try {
        const { rol, permisos, esAdmin } = req.body;

        const usuario = await User.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        if (rol !== undefined) {
            if (!["padre", "psicologo", "profesor"].includes(rol)) {
                return res.status(400).json({ message: "Rol no válido" });
            }
            usuario.rol = rol;
        }

        if (permisos && typeof permisos === "object") {
            if (!usuario.permisos) usuario.permisos = {};
            if (permisos.conContexto !== undefined) {
                usuario.permisos.conContexto = !!permisos.conContexto;
            }
            if (permisos.descargarPdf !== undefined) {
                usuario.permisos.descargarPdf = !!permisos.descargarPdf;
            }
            if (permisos.eliminarCuenta !== undefined) {
                usuario.permisos.eliminarCuenta = !!permisos.eliminarCuenta;
            }
            usuario.markModified("permisos");
        }

        if (esAdmin !== undefined) {
            const esElMismo = String(usuario._id) === String(req.usuario.id);
            if (esElMismo && esAdmin === false) {
                return res.status(400).json({ message: "No puedes quitarte a ti mismo el rol de administrador" });
            }
            if (usuario.esAdmin && esAdmin === false) {
                const totalAdmins = await User.countDocuments({ esAdmin: true });
                if (totalAdmins <= 1) {
                    return res.status(400).json({ message: "Debe quedar al menos un administrador" });
                }
            }
            usuario.esAdmin = !!esAdmin;
            // Al nombrar admin, la cuenta queda aprobada automáticamente.
            if (usuario.esAdmin && usuario.estado !== "aprobado") {
                usuario.estado = "aprobado";
            }
        }

        await usuario.save();

        return res.json({
            message: "Usuario actualizado",
            id: usuario._id,
            rol: usuario.rol,
            esAdmin: usuario.esAdmin,
            estado: usuario.estado,
            permisos: permisosEfectivos(usuario)
        });
    } catch (error) {
        console.error("Error en gestión de usuario:", error);
        return res.status(500).json({ message: "Error al actualizar el usuario" });
    }
});

module.exports = router;
