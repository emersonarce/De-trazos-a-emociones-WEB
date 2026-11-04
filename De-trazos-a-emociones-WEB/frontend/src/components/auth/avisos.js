// Textos de los avisos del login y el registro. Traduce los mensajes del
// backend (routes/auth.js) y los fallos de red a un título claro + una
// indicación de qué hacer. `campos` marca en rojo los campos implicados.

export const correoValido = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const avisoDeError = (error) => {
  const msg = error?.message || '';

  // fetch no llegó al servidor (backend apagado, sin internet, CORS).
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(msg)) {
    return {
      tipo: 'error',
      icono: 'conexion',
      titulo: 'No pudimos conectar con el servidor',
      texto: 'Revisa tu conexión a internet e inténtalo de nuevo en unos minutos.',
    };
  }
  if (/credenciales incorrectas/i.test(msg)) {
    return {
      tipo: 'error',
      titulo: 'Correo o contraseña incorrectos',
      texto: 'Revisa los datos e inténtalo de nuevo.',
      campos: ['email', 'password'],
    };
  }
  if (/pendiente de aprobación/i.test(msg)) {
    return {
      tipo: 'espera',
      titulo: 'Tu cuenta aún no está aprobada',
      texto: 'Podrás iniciar sesión cuando el administrador apruebe tu registro.',
    };
  }
  if (/rechazada/i.test(msg)) {
    return {
      tipo: 'error',
      titulo: 'Tu solicitud de registro fue rechazada',
      texto: 'Si crees que es un error, comunícate con el administrador.',
    };
  }
  if (/cuenta fue eliminada/i.test(msg)) {
    return {
      tipo: 'error',
      titulo: 'Esta cuenta fue eliminada',
      texto: 'Si fue un error, pídele al administrador que la restaure.',
    };
  }
  if (/de una cuenta eliminada/i.test(msg)) {
    return {
      tipo: 'error',
      titulo: 'Este correo es de una cuenta eliminada',
      texto: 'Si quieres recuperarla, pídele al administrador que la restaure.',
      campos: ['email'],
    };
  }
  if (/ya está registrado/i.test(msg)) {
    return {
      tipo: 'error',
      titulo: 'Este correo ya tiene una cuenta',
      texto: 'Usa otro correo o',
      enlace: { to: '/login', label: 'inicia sesión' },
      campos: ['email'],
    };
  }
  if (/obligatori/i.test(msg)) {
    return { tipo: 'error', titulo: 'Faltan datos', texto: 'Completa todos los campos para continuar.' };
  }
  if (/contraseña/i.test(msg)) {
    return { tipo: 'error', titulo: 'La contraseña no es segura', texto: msg, campos: ['password'] };
  }
  if (/interno del servidor|forma inesperada/i.test(msg)) {
    return {
      tipo: 'error',
      titulo: 'Algo falló en el servidor',
      texto: 'No es un problema de tus datos. Inténtalo de nuevo en unos minutos.',
    };
  }
  return { tipo: 'error', titulo: 'No pudimos completar la solicitud', texto: msg || 'Inténtalo de nuevo.' };
};
