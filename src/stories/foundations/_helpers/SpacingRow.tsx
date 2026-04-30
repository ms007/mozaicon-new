import { useCallback } from 'react'

import { resolveSpacing } from './spacing-utils'
import { useThemeReactiveToken } from './useThemeReactiveToken'

export type { SpacingRowProps }

interface SpacingRowProps {
  /** The multiplier (e.g. 1, 2, 4, 8). */
  multiplier: number
  /** Display name shown in the label (e.g. "1", "2", "px"). */
  name: string
}

export function SpacingRow({ multiplier, name }: SpacingRowProps) {
  const compute = useCallback(() => resolveSpacing(multiplier), [multiplier])
  const resolved = useThemeReactiveToken(compute)

  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-foreground w-10 shrink-0 text-right font-mono text-sm">{name}</span>
      {resolved ? (
        <>
          <div
            className="bg-primary h-3 shrink-0 rounded-sm"
            data-testid="spacing-bar"
            style={{ width: `${String(resolved.px)}px`, minWidth: 1 }}
          />
          <span className="text-muted-foreground shrink-0 font-mono text-xs">
            {resolved.raw} ({resolved.px}px)
          </span>
        </>
      ) : (
        <span className="text-muted-foreground text-sm italic">unavailable</span>
      )}
    </div>
  )
}
