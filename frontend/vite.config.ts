/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// strictPort: fail loudly if 5173 is taken. Moving to 5174 would look fine but every API
// call would be refused, because the backend's CORS only allows http://localhost:5173.
// `vite preview` (the production build, used by the end-to-end tests in CI) follows the same rule.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, strictPort: true },
  preview: { port: 5173, strictPort: true },
  test: {
    // npm run test:coverage. Counts application code only: not the sample data, types or tests.
    coverage: {
      provider: 'v8',
      include: ['api/**', 'components/**', 'context/**', 'pages/**', 'utils/**', 'src.tsx'],
      reporter: ['text', 'json-summary'],
      // Minimums a few points under the level on 14 Oct 2026, so only a real drop fails CI.
      // Pages and most components are covered by the end-to-end tests instead, hence the low
      // overall figure; the logic the unit tests are for (api, context, utils) has its own bar.
      thresholds: {
        lines: 20, branches: 70, functions: 50, // were 23.6, 77.4, 56.0
        '{api,context,utils}/**': { lines: 75, branches: 80, functions: 75 }, // were 80.6, 89.1, 81.8
      },
    },
  },
})
