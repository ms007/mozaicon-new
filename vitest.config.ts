import path from 'node:path'

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        // Existing unit / component tests (happy-dom)
        {
          extends: true,
          test: {
            name: 'unit',
            environment: 'happy-dom',
            globals: true,
            setupFiles: ['./src/test-setup.ts'],
            include: ['src/**/*.{test,spec}.{ts,tsx}'],
            exclude: ['e2e/**', 'node_modules/**'],
          },
        },
        // Storybook stories run as tests via addon-vitest (browser mode)
        {
          extends: true,
          plugins: [storybookTest({ configDir: path.join(__dirname, '.storybook') })],
          test: {
            name: 'storybook',
            browser: {
              enabled: true,
              headless: true,
              provider: playwright({}),
              instances: [{ browser: 'chromium' }],
            },
          },
        },
      ],
    },
  }),
)
