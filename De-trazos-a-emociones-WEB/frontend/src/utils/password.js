// Reglas de contraseña segura (deben coincidir con el validador del backend).
export const REGLAS_PASSWORD = [
  { test: (p) => p.length >= 8, label: 'Al menos 8 caracteres' },
  { test: (p) => /[A-Z]/.test(p), label: 'Una letra mayúscula' },
  { test: (p) => /[a-z]/.test(p), label: 'Una letra minúscula' },
  { test: (p) => /[0-9]/.test(p), label: 'Un número' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: 'Un símbolo (! @ # $ %)' },
];

export const passwordValida = (p = '') => REGLAS_PASSWORD.every((r) => r.test(p));
