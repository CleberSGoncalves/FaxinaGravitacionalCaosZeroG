import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Obrigatório para CrazyGames - caminhos relativos
  server: {
    port: 3009,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});
