// Historial del panel de administración: cada acción registrada
// (backend/models/AccionAdmin.js) en una frase legible y su detalle.

export const ETIQUETA_PERMISO = {
  conContexto: 'Análisis con contexto',
  descargarPdf: 'Descargar PDF',
  eliminarCuenta: 'Eliminar su cuenta',
};

export const ETIQUETA_ROL = {
  padre: 'Padre / Madre',
  psicologo: 'Psicólogo(a)',
  profesor: 'Profesor(a)',
};

const ESTADO = {
  pendiente: 'pendiente',
  aprobado: 'aprobada',
  rechazado: 'rechazada o deshabilitada',
  eliminado: 'eliminada por su usuario',
};

// { texto, detalle, tono } — tono: ok | alerta | peligro | neutro (color del ícono).
export function describirAccion(a = {}) {
  const admin = a.adminNombre || a.adminEmail || 'Un administrador';
  const quien = a.usuarioNombre || a.usuarioEmail || 'una cuenta';
  const d = a.detalle || {};
  switch (a.accion) {
    case 'aprobar_solicitud':
      return { texto: `${admin} aprobó la solicitud de ${quien}`, detalle: null, tono: 'ok' };
    case 'rechazar_solicitud':
      return { texto: `${admin} rechazó la solicitud de ${quien}`, detalle: null, tono: 'alerta' };
    case 'deshabilitar':
      return { texto: `${admin} deshabilitó la cuenta de ${quien}`, detalle: 'Ya no puede iniciar sesión.', tono: 'alerta' };
    case 'habilitar':
      return { texto: `${admin} habilitó de nuevo la cuenta de ${quien}`, detalle: null, tono: 'ok' };
    case 'restaurar':
      return { texto: `${admin} restauró la cuenta de ${quien}`, detalle: 'La había eliminado su usuario; volvió con todos sus datos.', tono: 'ok' };
    case 'eliminar_definitivo': {
      const n = Number(d.analisis) || 0;
      const borrados = n === 0
        ? 'No tenía análisis.'
        : n === 1 ? 'Se borró 1 análisis con su imagen.' : `Se borraron ${n} análisis con sus imágenes.`;
      const antes = d.estadoAnterior ? ` La cuenta estaba ${ESTADO[d.estadoAnterior] || d.estadoAnterior}.` : '';
      const eraAdmin = d.eraAdmin ? ' Era administrador(a).' : '';
      return { texto: `${admin} eliminó definitivamente la cuenta de ${quien}`, detalle: borrados + antes + eraAdmin, tono: 'peligro' };
    }
    case 'restablecer_password':
      return { texto: `${admin} restableció la contraseña de ${quien}`, detalle: 'Se le dio una contraseña temporal para cambiar al entrar.', tono: 'neutro' };
    case 'cambiar_rol':
      return {
        texto: `${admin} cambió el rol de ${quien}`,
        detalle: `${ETIQUETA_ROL[d.de] || d.de || '—'} → ${ETIQUETA_ROL[d.a] || d.a || '—'}`,
        tono: 'neutro',
      };
    case 'cambiar_permiso': {
      const permiso = `«${ETIQUETA_PERMISO[d.permiso] || d.permiso}»`;
      return d.valor
        ? { texto: `${admin} le dio a ${quien} el permiso ${permiso}`, detalle: null, tono: 'ok' }
        : { texto: `${admin} le quitó a ${quien} el permiso ${permiso}`, detalle: null, tono: 'alerta' };
    }
    case 'nombrar_admin':
      return { texto: `${admin} nombró administrador(a) a ${quien}`, detalle: 'Tiene todos los permisos y acceso a este panel.', tono: 'ok' };
    case 'quitar_admin':
      return { texto: `${admin} le quitó el rol de administrador a ${quien}`, detalle: null, tono: 'alerta' };
    default:
      return { texto: `${admin} hizo «${a.accion || 'una acción'}» en la cuenta de ${quien}`, detalle: null, tono: 'neutro' };
  }
}

// «04 nov 2026, 3:45 p. m.»
export function fechaHistorial(iso) {
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return '';
  return f.toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}
