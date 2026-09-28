import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// strictPort: fail loudly if 5173 is taken. Moving to 5174 would look fine but every API
// call would be refused, because the backend's CORS only allows http://localhost:5173.
export default defineConfig({ plugins: [react(), tailwindcss()], server: { port: 5173, strictPort: true } })
