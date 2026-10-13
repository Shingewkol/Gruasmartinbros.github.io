import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeFile } from 'node:fs/promises'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))
const maintenanceMode = process.env.VITE_MAINTENANCE === 'true'
const localHosts = new Set(['localhost', '127.0.0.1', '::1'])
const htmlInputs = {
  main: resolve(root, maintenanceMode ? 'mantenimiento.html' : 'index.html'),
  fotografia: resolve(root, 'fotografia.html'),
}

if (!maintenanceMode) {
  htmlInputs.mantenimiento = resolve(root, 'mantenimiento.html')
}

function localTextEditorPlugin() {
  return {
    name: 'local-text-editor',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (request.url?.split('?')[0] !== '/__save-textos') {
          return next()
        }

        const address = request.socket.remoteAddress
        const host = request.headers.host
        const origin = request.headers.origin
        const isLoopback =
          address === '::1' ||
          address === '127.0.0.1' ||
          address?.startsWith('::ffff:127.')
        let isLocalHost = false

        try {
          isLocalHost = localHosts.has(new URL(`http://${host}`).hostname)
        } catch {
          isLocalHost = false
        }

        if (!isLoopback || !isLocalHost || (origin && new URL(origin).host !== host)) {
          response.statusCode = 403
          response.end('Forbidden')
          return
        }

        if (request.method !== 'PUT') {
          response.statusCode = 405
          response.setHeader('Allow', 'PUT')
          response.end('Method Not Allowed')
          return
        }

        try {
          const chunks = []
          let size = 0
          for await (const chunk of request) {
            size += chunk.length
            if (size > 100_000) {
              response.statusCode = 413
              response.end('Payload Too Large')
              return
            }
            chunks.push(chunk)
          }

          const texts = JSON.parse(Buffer.concat(chunks).toString('utf8'))
          if (
            !Array.isArray(texts) ||
            texts.length > 100 ||
            texts.some((text) => typeof text !== 'string' || text.length > 10_000)
          ) {
            response.statusCode = 400
            response.end('Invalid text data')
            return
          }

          await writeFile(
            resolve(root, 'public', 'textos.json'),
            `${JSON.stringify(texts, null, 2)}\n`,
            'utf8',
          )
          response.statusCode = 204
          response.end()
        } catch {
          response.statusCode = 400
          response.end('Invalid request')
        }
      })
    },
  }
}

export default defineConfig({
  base: '/',
  plugins: [localTextEditorPlugin()],
  build: {
    rollupOptions: {
      input: htmlInputs,
    },
  },
})