const User = require("../models/User");

// Debe usarse después de verificarToken. Comprueba contra la base de datos que
// el usuario del token siga siendo administrador aprobado.
const verificarAdmin = async (req, res, next) => {
    try {
        const usuario = await User.findById(req.usuario.id);

        if (!usuario || !usuario.esAdmin || usuario.estado !== "aprobado") {
            return res.status(403).json({
                message: "Acceso permitido solo para administradores"
            });
        }

        // Quién es el administrador (para el historial de acciones).
        req.admin = usuario;
        next();
    } catch (error) {
        console.error("Error verificando administrador:", error);
        return res.status(500).json({
            message: "Error verificando permisos"
        });
    }
};

module.exports = verificarAdmin;
