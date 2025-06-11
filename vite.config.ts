import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    port: 7777,
    host: '127.0.0.1',
  },
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: [
                'electron',
                'electron-devtools-installer',
                'koa', // Add back to externals
                'koa-router', // Add back to externals
                'koa-bodyparser' // Add back to externals
              ],
            },
            emptyOutDir: false,
          },
        },
      },
      {
        entry: 'electron/preload/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/preload',
            rollupOptions: {
              external: ['electron'],
            },
            emptyOutDir: false,
          },
        },
      },
    ]),
    renderer(),
  ],
})
