import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 7777,
    host: '127.0.0.1',
  },
  plugins: [
    react(),
    electron([
      {
        // 主进程入口文件配置
        entry: 'electron/main/index.ts',
        // 移除可能导致问题的onstart配置
        vite: {
          build: {
            outDir: 'dist-electron/main',
            minify: false,
            rollupOptions: {
              external: ['electron', 'koa', 'koa-router', 'koa-bodyparser'],
            },
          },
        },
      },
      {
        entry: 'electron/preload/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/preload',
            minify: false,
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
})
