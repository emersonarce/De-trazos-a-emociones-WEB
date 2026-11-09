// Texto entendible a partir de un error (fetch caído, mensaje del backend…).
export const mensajeDeError = (err) => {
  const msg = err?.message || '';
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(msg)) {
    return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
  }
  return msg || 'Inténtalo de nuevo.';
};
