import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Define process.env for browser compatibility
    'process.env': {},
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.VITE_DEV': JSON.stringify(process.env.VITE_DEV || 'true'),
    global: 'globalThis',
  },
  build: {
    // Optimize for Vercel deployment
    target: 'esnext',
    sourcemap: false, // Disable sourcemaps for smaller builds
    chunkSizeWarningLimit: 1000, // Increase chunk size warning limit
    rollupOptions: {
      // Exclude Node.js specific dependencies from client bundle
      external: [
        'fs', 'path', 'os', 'crypto', 'stream', 'util', 'events',
        // Exclude LiveKit server packages that contain native binaries
        '@livekit/rtc-node',
        '@livekit/agents',
        'livekit-server-sdk',
        /^@livekit\/rtc-node/,
        /^@livekit\/agents/,
        // Exclude all Node.js modules
        /^node:/
      ],
      output: {
        // Optimize manual chunks for better loading
        manualChunks: {
          // Core React dependencies
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI libraries
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
            'lucide-react'
          ],
          
          // AI and ML libraries - separate chunk for lazy loading
          'ai-services': [
            '@xenova/transformers',
            '@google/generative-ai'
          ],
          
          // Voice services - only browser-compatible packages
          'voice-services': [
            'livekit-client'
          ],
          
          // Map and visualization - removed react-map-gl due to build issues
          'map-vendor': [
            'mapbox-gl'
          ],
          
          // Charts and data visualization
          'chart-vendor': [
            'chart.js',
            'react-chartjs-2',
            'recharts'
          ],
          
          // Utilities and smaller libraries
          'utils-vendor': [
            'axios',
            'date-fns',
            'clsx',
            'tailwind-merge',
            'uuid',
            'rxjs'
          ]
        },
        
        // Configure chunk file names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? path.basename(chunkInfo.facadeModuleId, '.js') : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        
        // Configure asset file names with proper null checking
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) {
            return `assets/[name]-[hash][extname]`;
          }
          
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          
          if (/\.(mp3|wav|ogg|flac)$/i.test(assetInfo.name)) {
            return `audio/[name]-[hash][extname]`;
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `images/[name]-[hash][extname]`;
          }
          if (extType === 'css') {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    
    // Optimize bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'] // Remove specific console methods
      }
    }
  },
  
  // Optimize dependencies for production
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react'
    ],
    exclude: [
      '@xenova/transformers',   // Exclude heavy AI libraries from pre-bundling
      'livekit-server-sdk',     // Server-only dependency
      '@livekit/rtc-node',      // Server-only dependency with native binaries
      '@livekit/agents',        // Server-only dependency with native binaries
      'mongoose',               // Server-only dependency
      'express',                // Server-only dependency
      'react-map-gl'            // Exclude due to build issues
    ]
  }
});
