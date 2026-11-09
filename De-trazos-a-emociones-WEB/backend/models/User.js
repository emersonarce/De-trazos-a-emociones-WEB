const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            trim: true
        },

        apellido: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        // La contraseña es temporal: la generó el administrador al
        // restablecerla (olvido). Al entrar, la app pide cambiarla; al
        // cambiarla vuelve a false.
        passwordTemporal: {
            type: Boolean,
            default: false
        },

        rol: {
            type: String,
            required: true,
            enum: ["padre", "psicologo", "profesor"]
        },

        // Institución o entidad a la que pertenece (colegio, consultorio...).
        // El administrador la ve al aprobar la cuenta.
        institucion: {
            type: String,
            trim: true,
            default: ""
        },

        // Estado de la cuenta. Hasta que no esté "aprobado" el usuario no
        // puede iniciar sesión. "eliminado": el usuario eliminó su cuenta (con
        // el permiso eliminarCuenta). No se borra: queda desactivada y con sus
        // datos hasta que el administrador la restaure o la elimine
        // definitivamente.
        estado: {
            type: String,
            enum: ["pendiente", "aprobado", "rechazado", "eliminado"],
            default: "pendiente"
        },

        // Cuándo el usuario eliminó su cuenta (solo con estado "eliminado").
        eliminadoEn: {
            type: Date
        },

        // Administrador: puede aprobar o rechazar registros.
        esAdmin: {
            type: Boolean,
            default: false
        },

        // Super administrador: por encima de los demás administradores (solo él
        // les quita el rol, elimina sus cuentas o restablece sus contraseñas) y
        // nadie lo modifica desde el panel. Solo lo asigna SUPERADMIN_EMAILS
        // (.env) o el banco demo, nunca la app. Ver utils/admin.js.
        esSuperAdmin: {
            type: Boolean,
            default: false
        },

        // Ruta de la foto de perfil (relativa). La imagen se sirve protegida.
        fotoPerfil: {
            type: String,
            default: ""
        },

        // Permisos por usuario, que gestiona el administrador. Si no están
        // definidos (cuentas creadas antes de esta función) se consideran
        // "heredados" con acceso completo; los administradores siempre tienen
        // todos los permisos. Ver utils/permisos.js (permisosEfectivos).
        permisos: {
            // Analizar CON contexto del niño (incluye registrar niños y las
            // herramientas de historial/seguimiento). Sin esto, solo se puede
            // analizar un dibujo suelto con su descripción.
            conContexto: { type: Boolean },
            // Exportar / descargar PDF.
            descargarPdf: { type: Boolean },
            // Eliminar su propia cuenta. Nunca es automático (tampoco en las
            // cuentas heredadas): lo asigna el administrador, para evitar
            // borrados por accidente. Aun con él, la cuenta solo se desactiva.
            eliminarCuenta: { type: Boolean }
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", UserSchema);