import { mergeConfig, defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: false,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/test/**',
          'src/**/*.test.*',
          '**/*.d.ts',
          // Entry points and dev-only wiring, exercised by the build and Playwright instead.
          'src/main.tsx',
          'src/App.tsx',
          'src/preview.tsx',
          'src/styles/fonts.ts',
        ],
        // Floor, not target: CI fails if coverage drops below today's level.
        thresholds: { statements: 90, lines: 90, branches: 82, functions: 78 },
      },
    },
  }),
)
