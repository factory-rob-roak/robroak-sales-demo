import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Lets contrast tests read stylesheet source; CSS Modules stay unprocessed otherwise.
    css: { include: [/\.module\.css\?raw$/] },
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
