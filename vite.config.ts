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
                // 'koa', 'koa-router', 'koa-bodyparser' 
                // 已移除 Koa 相关依赖，让 Rollup 打包进 bundle
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
