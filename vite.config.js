import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))
const maintenanceMode = process.env.VITE_MAINTENANCE === 'true'
const htmlInputs = {
  main: resolve(root, maintenanceMode ? 'mantenimiento.html' : 'index.html'),
  fotografia: resolve(root, 'fotografia.html'),
}

if (!maintenanceMode) {
  htmlInputs.mantenimiento = resolve(root, 'mantenimiento.html')
}

export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      input: htmlInputs,
    },
  },
})