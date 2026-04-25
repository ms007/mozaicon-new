import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

const dirname = path.dirname(fileURLToPath(import.meta.url))

function hasBrowserDeps(): boolean {
  try {
    const out = execFileSync('ldconfig', ['-p'], { timeout: 5000, stdio: 'pipe' }).toString()
    return out.includes('libnspr4') && out.includes('libnss3')
  } catch {
    // ldconfig unavailable (non-Linux or not in PATH)
    return false
  }
}

const browserDepsAvailable = hasBrowserDeps()
if (!browserDepsAvailable && !process.env._VITEST_SB_WARNED) {
  process.env._VITEST_SB_WARNED = '1'
  process.stderr.write(
    '[vitest] Chromium system libraries (libnspr4, libnss3) not detected — ' +
      'storybook project skipped. Story tests will not run in this pass.\n',
  )
}

const storybookProject = {
  extends: './vite.config.ts' as const,
  plugins: [
    storybookTest({
      configDir: path.join(dirname, '.storybook'),
    }),
  ],
  test: {
    name: 'storybook' as const,
    browser: {
      enabled: true as const,
      headless: true as const,
      provider: playwright({}),
      instances: [{ browser: 'chromium' as const }],
    },
  },
}

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
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
        ...(browserDepsAvailable ? [storybookProject] : []),
      ],
    },
  }),
)
