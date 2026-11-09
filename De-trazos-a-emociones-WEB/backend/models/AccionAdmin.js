const mongoose = require("mongoose");

// Historial de lo que hacen los administradores en el panel: quién, qué, a
// qué cuenta, cuándo y el detalle (antes → después). Guarda el nombre y el
// correo de ambos tal como eran en ese momento, para que el registro siga
// legible aunque la cuenta se elimine después. Nunca guarda contraseñas.
const ACCIONES = [
    "aprobar_solicitud",    // pendiente → aprobado
    "rechazar_solicitud",   // pendiente → rechazado
    "deshabilitar",         // aprobado → rechazado
    "habilitar",            // rechazado → aprobado
    "restaurar",            // eliminado (por su usuario) → aprobado
    "eliminar_definitivo",  // borra la cuenta, sus análisis e imágenes
    "restablecer_password", // contraseña temporal (sin guardarla)
    "cambiar_rol",          // detalle: { de, a }
    "cambiar_permiso",      // detalle: { permiso, valor }
    "nombrar_admin",
    "quitar_admin",
];

const AccionAdminSchema = new mongoose.Schema({
    accion: { type: String, enum: ACCIONES, required: true },

    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    adminNombre: String,
    adminEmail: String,

    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    usuarioNombre: String,
    usuarioEmail: String,

    // Datos propios de cada acción (estado anterior, rol de/a, permiso...).
    detalle: { type: mongoose.Schema.Types.Mixed, default: {} },

    fecha: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model("AccionAdmin", AccionAdminSchema, "acciones_admin");
module.exports.ACCIONES = ACCIONES;
