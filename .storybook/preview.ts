// Tailwind v4 entrypoint: `@import 'tailwindcss'` + `@theme inline` + tokens.
// Importing here pulls the same cascade Vite ships in production into the
// Storybook preview iframe; `parentSelector: 'html'` below mirrors how the
// app applies dark mode (`@custom-variant dark (&:is(.dark *))`).
//
// Layer-ordering spike outcome: the Storybook-Vite builder picks up the root
// `vite.config.ts` (with `@tailwindcss/vite`) and the `@/` alias automatically.
// `storybook build` produced a CSS bundle containing both `:root` tokens and
// `.dark { … }` overrides with `text-foreground` utilities resolving to
// `var(--foreground)` — no `viteFinal` override or `preview.css` shim needed.
import '../src/index.css'

import { withThemeByClassName } from '@storybook/addon-themes'
import type { Preview } from '@storybook/react-vite'

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    // Surface axe violations in the panel without failing the story render —
    // the parent issue (#57) wires `addon-a11y` into the Vitest pass later.
    a11y: { test: 'todo' },
  },
  decorators: [
    withThemeByClassName({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
      parentSelector: 'html',
    }),
  ],
}

export default preview
