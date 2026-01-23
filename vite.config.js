import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig(({ command, mode }) => {
  // Determine which page to build based on environment variable
  const page = process.env.BUILD_PAGE || 'index';
  const inputFile = page === 'admin' ? 'admin.html' : 'index.html';
  
  return {
    plugins: [
      wasm(),
      topLevelAwait(),
      viteSingleFile(),
    ],
    optimizeDeps: {
      exclude: ['@mysten/walrus-wasm'],
      esbuildOptions: {
        target: 'esnext',
      },
    },
    build: {
      target: 'esnext',
      assetsInlineLimit: 100000000,
      chunkSizeWarningLimit: 100000000,
      cssCodeSplit: false,
      outDir: 'dist',
      rollupOptions: {
        input: inputFile,
        output: {
          inlineDynamicImports: true,
        },
      },
    },
    server: {
      fs: {
        allow: ['..'],
      },
    },
    assetsInclude: ['**/*.wasm'],
  };
});
