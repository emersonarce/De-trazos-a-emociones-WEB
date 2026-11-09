// Registra en el historial (models/AccionAdmin.js) una acción del panel de
// administración. Es de mejor esfuerzo: si el registro falla, la acción ya
// hecha no se deshace; se avisa en la consola del servidor.
const AccionAdmin = require("../models/AccionAdmin");

const nombreDe = (u) => [u && u.nombre, u && u.apellido].filter(Boolean).join(" ");

async function registrarAccion(req, usuario, accion, detalle = {}) {
    try {
        const admin = req.admin || {};
        await AccionAdmin.create({
            accion,
            adminId: admin._id || (req.usuario && req.usuario.id),
            adminNombre: nombreDe(admin),
            adminEmail: admin.email || (req.usuario && req.usuario.email) || "",
            usuarioId: usuario && usuario._id,
            usuarioNombre: nombreDe(usuario),
            usuarioEmail: (usuario && usuario.email) || "",
            detalle,
            fecha: new Date(),
        });
    } catch (error) {
        console.error(`No se pudo registrar en el historial (${accion}):`, error.message);
    }
}

module.exports = { registrarAccion };
