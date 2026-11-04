// Permisos efectivos de un usuario.
// - Los administradores tienen todos los permisos, menos eliminar su propia
//   cuenta.
// - Las cuentas creadas ANTES de esta función (sin el objeto permisos) se
//   consideran "heredadas" con acceso completo, para no romper cuentas que ya
//   funcionaban.
// - Las cuentas nuevas se crean con permisos explícitos (solo dibujo suelto);
//   el administrador habilita lo demás por usuario.
// - Eliminar la propia cuenta nunca es automático, ni siquiera en las cuentas
//   heredadas: lo asigna el administrador.
function permisosEfectivos(usuario) {
    if (!usuario) {
        return { conContexto: false, descargarPdf: false, eliminarCuenta: false, admin: false };
    }

    if (usuario.esAdmin) {
        return { conContexto: true, descargarPdf: true, eliminarCuenta: false, admin: true };
    }

    const p = usuario.permisos;
    const eliminarCuenta = !!(p && p.eliminarCuenta);
    const sinDefinir =
        !p || (p.conContexto === undefined && p.descargarPdf === undefined);

    if (sinDefinir) {
        // Cuenta heredada: mantiene acceso completo hasta que el admin la ajuste.
        return { conContexto: true, descargarPdf: true, eliminarCuenta, admin: false };
    }

    return {
        conContexto: !!p.conContexto,
        descargarPdf: !!p.descargarPdf,
        eliminarCuenta,
        admin: false
    };
}

module.exports = { permisosEfectivos };
