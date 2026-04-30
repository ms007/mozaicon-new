import { useCallback } from 'react'

import { useThemeReactiveToken } from './useThemeReactiveToken'

interface TokenSwatchProps {
  /** CSS custom property name, e.g. `--primary` */
  variable: string
  label?: string
}

function resolveCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export function TokenSwatch({ variable, label }: TokenSwatchProps) {
  const read = useCallback(() => resolveCssVar(variable), [variable])
  const value = useThemeReactiveToken(read)

  const isEmpty = !value

  return (
    <div className="flex items-center gap-3" data-testid="token-swatch">
      <div
        className="border-border size-10 shrink-0 rounded-md border"
        style={{ backgroundColor: isEmpty ? 'transparent' : value }}
        data-testid="swatch-preview"
      />
      <div className="flex min-w-0 flex-col">
        {label && <span className="text-foreground text-sm font-medium">{label}</span>}
        <code className="text-muted-foreground text-xs">{variable}</code>
        <span className="text-muted-foreground text-xs" data-testid="swatch-value">
          {isEmpty ? 'unset' : value}
        </span>
      </div>
    </div>
  )
}
