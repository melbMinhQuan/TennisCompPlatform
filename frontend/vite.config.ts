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
      // Minimums a few points under the level on 18 Oct 2026, so only a real drop fails CI.
      // The overall figure is low because the player pages are tested end to end instead; the
      // club administrator pages are rendered against a fake backend too (club-admin-pages.test.tsx).
      // The logic the unit tests are for (api, context, utils) has its own, higher bar.
      thresholds: {
        lines: 36, branches: 72, functions: 60, // were 40.1, 76.7, 64.9
        '{api,context,utils}/**': { lines: 75, branches: 80, functions: 75 }, // were 87.3, 88.8, 85.1
      },
    },
  },
})
