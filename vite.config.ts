import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [svgr(), react()],
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'redstone',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'ws']
    }
  },
  optimizeDeps: {
    exclude: ['ws'],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env._NODE_ENV),
    'process.env.PROMISE_QUEUE_COVERAGE': JSON.stringify(false)
  }
})