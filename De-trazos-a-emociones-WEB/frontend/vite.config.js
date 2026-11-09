import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// El frontend llama al backend por su URL absoluta (http://localhost:3000),
// así que no se necesita proxy de desarrollo.
export default defineConfig({
  plugins: [react()],
})
