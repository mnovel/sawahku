import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://192.168.100.205:8090', 
    },
  },
  build: {
    chunkSizeWarningLimit: 600, // Menyesuaikan batas warning jika diperlukan
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Memisahkan library node_modules agar terpecah rapi
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});