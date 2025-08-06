import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { exec } from 'child_process';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

// Helper function to run the Go WASM build command
const buildWasm = () => {
  return new Promise((resolve, reject) => {
    // The command to compile your Go code to WASM
    const command = `GOOS=js GOARCH=wasm go build -o ${path.resolve(
      __dirname,
      'public/lib.wasm'
    )} ${path.resolve(__dirname, '../lib')}`;

    console.log('Compiling Go to WASM...');
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error('WASM Compilation Error:', stderr);
        reject(err);
        return;
      }
      console.log('WASM compiled successfully.');
      resolve(stdout);
    });
  });
};

// Custom Vite plugin
const watchGoLibPlugin = () => {
  return {
    name: 'watch-go-lib',
    // This hook is called when the dev server is configured
    async configureServer(server) {
      // 1. Initial build when the server starts
      await buildWasm();

      // 2. Set up the watcher - try these alternatives
      // Option A: Watch the entire lib directory
      server.watcher.add(path.resolve(__dirname, '../lib'));

      // Option B: Use explicit glob patterns
      server.watcher.add(path.resolve(__dirname, '../lib/**/*.go'));

      // Option C: Add multiple specific patterns
      server.watcher.add([
        path.resolve(__dirname, '../lib/*.go'),
        path.resolve(__dirname, '../lib/**/*.go'),
      ]);

      // 3. Listen for 'change' events on the watched files
      server.watcher.on('change', async file => {
        console.log(file);
        if (file.endsWith('.go')) {
          console.log(`Go file changed: ${file}. Recompiling WASM...`);
          try {
            await buildWasm();
            // 4. Trigger a full page reload in the browser
            server.ws.send({
              type: 'full-reload',
              path: '*',
            });
          } catch (error) {
            console.error('Failed to recompile WASM.');
          }
        }
      });
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const __DESKTOP__ = mode === 'wails';
  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(__DESKTOP__ ? [watchGoLibPlugin()] : []),
    ],
    optimizeDeps: {
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    },
    define: {
      __DESKTOP__: String(__DESKTOP__),
    },
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@constants': path.resolve(__dirname, './constants.ts'),
        '@types': path.resolve(__dirname, './types.ts'),
      },
    },
  };
});
