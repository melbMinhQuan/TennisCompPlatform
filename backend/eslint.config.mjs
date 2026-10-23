// The checks from coding_standards.docx section 8, plus its naming rules (section 1).
// Run with `npm run lint` in backend/.
import eslint from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const NAMING = [
  'error',
  { selector: 'variable', format: ['camelCase', 'UPPER_CASE', 'PascalCase'], leadingUnderscore: 'allow' },
  { selector: 'function', format: ['camelCase', 'PascalCase'] },
  { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
  { selector: 'typeLike', format: ['PascalCase'] },
]

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'test/**'] },
  {
    files: ['src/**/*.ts', 'prisma/**/*.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/naming-convention': NAMING,
      eqeqeq: 'error',
      'no-console': 'warn',
      // Single letters only for loop counters (coding_standards.docx 1.2).
      'id-length': ['error', { min: 2, exceptions: ['i', 'j', 'k', '_'], properties: 'never' }],
    },
  },
  {
    files: ['prisma/**/*.js'],
    extends: [eslint.configs.recommended],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      eqeqeq: 'error',
      'id-length': ['error', { min: 2, exceptions: ['i', 'j', 'k', '_'], properties: 'never' }],
    },
  },
  // Command-line data scripts report to the terminal; printing is their job.
  { files: ['prisma/**'], rules: { 'no-console': 'off' } },
)
