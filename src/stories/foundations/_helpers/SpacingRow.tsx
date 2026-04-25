import { useState } from 'react'

import { useCssVar } from './useCssVar'

interface SpacingRowProps {
  scale: number
  label?: string
}

export function SpacingRow({ scale, label }: SpacingRowProps) {
  const [el, setEl] = useState<HTMLDivElement | null>(null)
  const spacing = useCssVar('--spacing', el)

  return (
    <div ref={setEl} className="flex items-center gap-3 py-2">
      <div
        className="bg-primary h-4 shrink-0 rounded-sm"
        style={{ width: spacing ? `calc(${spacing} * ${String(scale)})` : undefined }}
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-col">
        <code className="text-sm">{label ?? String(scale)}</code>
        <code className="text-muted-foreground text-xs">
          {spacing ? `${String(scale)} × ${spacing}` : '(not set)'}
        </code>
      </div>
    </div>
  )
}
