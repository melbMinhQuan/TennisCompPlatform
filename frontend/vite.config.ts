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
      // Minimums a few points under the level on 15 Oct 2026, so only a real drop fails CI.
      // The overall figure is low because pages are tested end to end instead. The club
      // administrator pages (PR #25) have no end-to-end tests yet: add those, then raise it.
      // The logic the unit tests are for (api, context, utils) has its own, higher bar.
      thresholds: {
        lines: 10, branches: 70, functions: 50, // were 13.6, 75.2, 54.5
        '{api,context,utils}/**': { lines: 75, branches: 80, functions: 75 }, // were 83.9, 89.7, 86.4
      },
    },
  },
})
