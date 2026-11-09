// URL base del backend.
// - Desarrollo: backend local en el puerto 3000.
// - Producción (npm run build): por defecto usa rutas relativas (mismo origen),
//   pensado para que el backend sirva el frontend compilado en un solo puerto.
// - Se puede forzar con VITE_API_URL al compilar (p. ej. "http://host:3000"
//   si el backend corre en otra URL).
export const API_URL =
  import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:3000');
