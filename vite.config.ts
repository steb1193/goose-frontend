import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.GOOSE_FRONTEND_PORT || '5173', 10),
    host: '0.0.0.0',
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.GOOSE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Проксируем Socket.IO на тот же порт что и API
      '/socket.io': {
        target: process.env.GOOSE_WS_URL || 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
