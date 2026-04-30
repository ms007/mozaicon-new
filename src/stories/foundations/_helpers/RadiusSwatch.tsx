import { useCallback } from 'react'

import { cn } from '@/lib/utils'

import { useThemeReactiveToken } from './useThemeReactiveToken'

export interface RadiusSwatchProps {
  /** CSS custom property name, e.g. `--radius-lg`. */
  token: string
  /** Human-readable label shown beneath the swatch. */
  label: string
  className?: string
}

function resolveToken(token: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  return raw || ''
}

export function RadiusSwatch({ token, label, className }: RadiusSwatchProps) {
  const read = useCallback(() => resolveToken(token), [token])
  const value = useThemeReactiveToken(read)
  const resolved = value || '0px'

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div
        data-testid="radius-swatch"
        className="border-border bg-primary/20 size-16 border"
        style={{ borderRadius: resolved }}
      />
      <span className="text-foreground text-sm font-medium">{label}</span>
      <code className="text-muted-foreground text-xs">{token}</code>
      <span className="text-muted-foreground text-xs tabular-nums">{value || '–'}</span>
    </div>
  )
}
