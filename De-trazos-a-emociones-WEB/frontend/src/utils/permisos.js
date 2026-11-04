// Helpers de permisos en el cliente. La autoridad real es el backend; esto solo
// sirve para ocultar/mostrar la interfaz según lo que el usuario puede hacer.

export const leerUsuario = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

// Permisos efectivos del usuario guardado en localStorage. Eliminar la propia
// cuenta solo vale si el administrador lo asignó (nunca para un administrador).
export const permisosActuales = () => {
  const u = leerUsuario();
  if (u.esAdmin) return { conContexto: true, descargarPdf: true, eliminarCuenta: false, admin: true };

  const p = u.permisos || {};
  const eliminarCuenta = !!p.eliminarCuenta;
  // Cuenta antigua guardada sin permisos: no restringimos en el cliente (el
  // backend decide). Al volver a iniciar sesión llegarán los permisos reales.
  if (p.conContexto === undefined && p.descargarPdf === undefined) {
    return { conContexto: true, descargarPdf: true, eliminarCuenta, admin: false };
  }

  return {
    conContexto: !!p.conContexto,
    descargarPdf: !!p.descargarPdf,
    eliminarCuenta,
    admin: false,
  };
};

export const puedeContexto = () => permisosActuales().conContexto;
export const puedePdf = () => permisosActuales().descargarPdf;
