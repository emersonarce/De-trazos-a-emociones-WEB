const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Analysis = require("../models/Analysis");
const AccionAdmin = require("../models/AccionAdmin");
const verificarToken = require("../middleware/authMiddleware");
const verificarAdmin = require("../middleware/adminMiddleware");
const { permisosEfectivos } = require("../utils/permisos");
const { generarPasswordTemporal } = require("../utils/password");
const { bloqueoSobreAdmin } = require("../utils/admin");
const { registrarAccion } = require("../utils/auditoria");

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
            .select("nombre apellido email rol institucion estado esAdmin esSuperAdmin permisos createdAt eliminadoEn passwordTemporal")
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
            esSuperAdmin: Boolean(u.esSuperAdmin),
            createdAt: u.createdAt,
            eliminadoEn: u.eliminadoEn,
            // Tiene la contraseña temporal del administrador y aún no la cambia.
            passwordTemporal: Boolean(u.passwordTemporal),
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

        const estadoAnterior = usuario.estado;
        usuario.estado = nuevoEstado;
        usuario.eliminadoEn = undefined;
        await usuario.save();

        // Historial: qué fue exactamente, según el estado de antes.
        if (estadoAnterior !== nuevoEstado) {
            const clave = accion === "restaurar" ? "restaurar"
                : accion === "aprobar" ? (estadoAnterior === "rechazado" ? "habilitar" : "aprobar_solicitud")
                : (estadoAnterior === "aprobado" ? "deshabilitar" : "rechazar_solicitud");
            await registrarAccion(req, usuario, clave, { estadoAnterior, estadoNuevo: nuevoEstado });
        }

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

        // Un administrador solo lo elimina el super administrador; al super
        // administrador no lo elimina nadie desde el panel.
        const bloqueo = bloqueoSobreAdmin(req.admin, usuario);
        if (bloqueo) {
            return res.status(403).json({ message: bloqueo });
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
        await registrarAccion(req, usuario, "eliminar_definitivo", {
            estadoAnterior: usuario.estado,
            analisis: analisis.length,
            ...(usuario.esAdmin && { eraAdmin: true }),
        });

        return res.json({ message: "Cuenta eliminada", id: usuario._id });
    } catch (error) {
        console.error("Error eliminando usuario:", error);
        return res.status(500).json({ message: "Error al eliminar la cuenta" });
    }
});

/*
========================================
RESTABLECER LA CONTRASEÑA (CONTRASEÑA TEMPORAL)
POST /admin/usuarios/:id/restablecer-password
Para quien olvidó su contraseña. Las contraseñas se guardan cifradas (bcrypt)
y nadie puede verlas, ni el administrador: se genera una temporal, que la
respuesta trae UNA sola vez para que el administrador se la dé al usuario. No
se guarda legible ni se escribe en el registro. Al entrar con ella, la app
pide cambiarla (passwordTemporal).
========================================
*/

router.post("/usuarios/:id/restablecer-password", verificarToken, verificarAdmin, async (req, res) => {
    try {
        const usuario = await User.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        if (String(usuario._id) === String(req.usuario.id)) {
            return res.status(400).json({ message: "Tu propia contraseña se cambia en Configuración" });
        }

        const bloqueo = bloqueoSobreAdmin(req.admin, usuario);
        if (bloqueo) {
            return res.status(403).json({ message: bloqueo });
        }

        if (usuario.estado !== "aprobado") {
            return res.status(400).json({ message: "Solo se puede restablecer la contraseña de una cuenta aprobada" });
        }

        const temporal = generarPasswordTemporal();
        usuario.password = await bcrypt.hash(temporal, 12);
        usuario.passwordTemporal = true;
        await usuario.save();
        await registrarAccion(req, usuario, "restablecer_password"); // sin la contraseña

        return res.json({ message: "Contraseña restablecida", id: usuario._id, temporal });
    } catch (error) {
        console.error("Error restableciendo la contraseña:", error.message);
        return res.status(500).json({ message: "Error al restablecer la contraseña" });
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

        // A otro administrador (rol, permisos o quitarle el rol) solo lo
        // modifica el super administrador; al super administrador, nadie.
        // Nombrar administrador a una cuenta normal sí puede cualquiera.
        const bloqueo = bloqueoSobreAdmin(req.admin, usuario);
        if (bloqueo) {
            return res.status(403).json({ message: bloqueo });
        }

        // Cómo estaba antes, para registrar en el historial solo lo que cambió.
        const antes = { rol: usuario.rol, esAdmin: Boolean(usuario.esAdmin), permisos: permisosEfectivos(usuario) };

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

        // Historial: una entrada por cada cosa que cambió.
        if (usuario.rol !== antes.rol) {
            await registrarAccion(req, usuario, "cambiar_rol", { de: antes.rol, a: usuario.rol });
        }
        const cambioAdmin = Boolean(usuario.esAdmin) !== antes.esAdmin;
        // Los permisos de un administrador salen de serlo: al nombrarlo o
        // quitarlo, o si ya lo es, no se registran como cambios aparte.
        if (!cambioAdmin && !usuario.esAdmin) {
            const despues = permisosEfectivos(usuario);
            for (const permiso of ["conContexto", "descargarPdf", "eliminarCuenta"]) {
                if (despues[permiso] !== antes.permisos[permiso]) {
                    await registrarAccion(req, usuario, "cambiar_permiso", { permiso, valor: despues[permiso] });
                }
            }
        }
        if (cambioAdmin) {
            await registrarAccion(req, usuario, usuario.esAdmin ? "nombrar_admin" : "quitar_admin");
        }

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

/*
========================================
HISTORIAL DE ACCIONES DEL PANEL
GET /admin/historial?antes=<fecha ISO>
De la más reciente a la más antigua, de a 50 («hayMas» indica si hay más;
se piden con antes = la fecha de la última recibida).
========================================
*/

const LIMITE_HISTORIAL = 50;

router.get("/historial", verificarToken, verificarAdmin, async (req, res) => {
    try {
        const filtro = {};
        if (req.query.antes) {
            const antes = new Date(String(req.query.antes));
            if (Number.isNaN(antes.getTime())) {
                return res.status(400).json({ message: "Fecha no válida" });
            }
            filtro.fecha = { $lt: antes };
        }

        const acciones = await AccionAdmin.find(filtro)
            .sort({ fecha: -1 })
            .limit(LIMITE_HISTORIAL + 1)
            .lean();

        return res.json({
            acciones: acciones.slice(0, LIMITE_HISTORIAL).map((a) => ({
                _id: a._id,
                accion: a.accion,
                adminNombre: a.adminNombre,
                adminEmail: a.adminEmail,
                usuarioNombre: a.usuarioNombre,
                usuarioEmail: a.usuarioEmail,
                detalle: a.detalle || {},
                fecha: a.fecha
            })),
            hayMas: acciones.length > LIMITE_HISTORIAL
        });
    } catch (error) {
        console.error("Error leyendo el historial:", error);
        return res.status(500).json({ message: "Error al obtener el historial" });
    }
});

module.exports = router;
