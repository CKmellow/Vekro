import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// MVC boundaries (see ARCHITECTURE.md):
// views       -> may import controllers, lib, other views; never models, never fetch
// controllers -> may import models and lib; never views, never JSX
// models      -> may import lib only; never controllers, views or app
// lib         -> imports nothing from the app layers
const layer = (name) => [`@/${name}`, `@/${name}/*`, `**/${name}/**`]
const restrict = (layers, message) => ({
  'no-restricted-imports': ['error', { patterns: [{ group: layers.flatMap(layer), message }] }],
})
const noFetch = {
  'no-restricted-globals': ['error', { name: 'fetch', message: 'Only src/models/api may call fetch.' }],
  'no-restricted-properties': [
    'error',
    { object: 'window', property: 'fetch', message: 'Only src/models/api may call fetch.' },
  ],
}

export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'dev-dist',
      'playwright-report',
      '.agents',
      '.claude',
      '.github',
      'design',
      'src/models/api/schema.d.ts',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strict, jsxA11y.flatConfigs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['src/views/**/*.{ts,tsx}'],
    rules: {
      ...restrict(['models'], 'Views get data through controller hooks, never from models.'),
      ...noFetch,
    },
  },
  {
    files: ['src/controllers/**/*.{ts,tsx}'],
    rules: {
      ...restrict(['views'], 'Controllers return plain props; they never import views.'),
      ...noFetch,
      'no-restricted-syntax': [
        'error',
        { selector: 'JSXElement, JSXFragment', message: 'Controllers never render JSX.' },
      ],
    },
  },
  {
    files: ['src/models/**/*.{ts,tsx}'],
    ignores: ['src/models/api/**'],
    rules: { ...restrict(['controllers', 'views', 'app'], 'Models import only lib.'), ...noFetch },
  },
  {
    files: ['src/models/api/**/*.{ts,tsx}'],
    rules: restrict(['controllers', 'views', 'app'], 'Models import only lib.'),
  },
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: { ...restrict(['models', 'controllers', 'views', 'app'], 'lib is dependency-free.'), ...noFetch },
  },
  {
    files: ['scripts/**/*.{js,mjs}', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  prettier,
)
