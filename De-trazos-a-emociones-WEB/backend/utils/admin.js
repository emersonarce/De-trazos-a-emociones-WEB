// Correos que son administradores, definidos en ADMIN_EMAILS (.env),
// separados por coma. Un usuario con un correo de esta lista queda como
// administrador y aprobado automáticamente al registrarse o iniciar sesión.
//
// SUPERADMIN_EMAILS (.env), igual pero para el super administrador: está por
// encima de los demás administradores (solo él puede quitarles el rol,
// eliminar sus cuentas o restablecer sus contraseñas) y nadie puede
// modificarlo desde el panel. Solo se asigna por esta lista, nunca desde la app.

const lista = (variable) =>
    (process.env[variable] || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

const esEmailAdmin = (email) =>
    Boolean(email) && lista("ADMIN_EMAILS").includes(email.toLowerCase().trim());

const esEmailSuperAdmin = (email) =>
    Boolean(email) && lista("SUPERADMIN_EMAILS").includes(email.toLowerCase().trim());

// Qué impide que el administrador de la petición (req.admin) modifique o
// elimine la cuenta `usuario`; null si puede. Sobre otro administrador solo
// actúa el super administrador; sobre el super administrador, nadie.
function bloqueoSobreAdmin(admin, usuario) {
    if (usuario && usuario.esSuperAdmin) {
        return "La cuenta del super administrador no se puede modificar desde el panel";
    }
    if (usuario && usuario.esAdmin && !(admin && admin.esSuperAdmin)) {
        return "Solo el super administrador puede modificar o eliminar a otros administradores";
    }
    return null;
}

module.exports = { esEmailAdmin, esEmailSuperAdmin, bloqueoSobreAdmin };
