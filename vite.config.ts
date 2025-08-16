import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }

          // React Router
          if (id.includes('react-router-dom')) {
            return 'router-vendor';
          }

          // Redux and RTK Query
          if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) {
            return 'redux-vendor';
          }

          // D3 and other chart libraries
          if (id.includes('d3')) {
            return 'chart-vendor';
          }

          // Form libraries
          if (id.includes('formik') || id.includes('yup')) {
            return 'form-vendor';
          }

          // Icon libraries
          if (
            id.includes('@heroicons/react') ||
            id.includes('lucide-react') ||
            id.includes('react-icons')
          ) {
            return 'icon-vendor';
          }

          // Other utilities
          if (
            id.includes('fuse.js') ||
            id.includes('react-select') ||
            id.includes('react-modal') ||
            id.includes('@tanstack/react-table')
          ) {
            return 'utils-vendor';
          }

          // Results pages
          if (id.includes('/pages/Resultados/')) {
            return 'results-pages';
          }

          // Admin geographic pages
          if (
            id.includes('/pages/Departments/') ||
            id.includes('/pages/Provinces/') ||
            id.includes('/pages/Municipalities/') ||
            id.includes('/pages/ElectoralSeats/') ||
            id.includes('/pages/ElectoralLocations/') ||
            id.includes('/pages/ElectoralTables/')
          ) {
            return 'geographic-admin';
          }

          // Other admin pages
          if (
            id.includes('/pages/Configurations/') ||
            id.includes('/pages/PoliticalParties/') ||
            id.includes('/pages/Partidos/')
          ) {
            return 'admin-pages';
          }

          // Store/API related
          if (id.includes('/store/')) {
            return 'store';
          }

          // Node modules that don't fit other categories
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    // Adjust chunk size limit to reduce warnings while keeping reasonable sizes
    chunkSizeWarningLimit: 800,
  },
});
