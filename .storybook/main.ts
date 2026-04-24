import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|mdx)'],
  framework: '@storybook/react-vite',
  addons: ['@storybook/addon-themes', '@storybook/addon-a11y', '@storybook/addon-vitest'],
}

export default config
