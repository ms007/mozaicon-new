import { useState } from 'react'

import { useCssVar } from './useCssVar'

interface TokenSwatchProps {
  variable: string
  label?: string
}

export function TokenSwatch({ variable, label }: TokenSwatchProps) {
  const [el, setEl] = useState<HTMLDivElement | null>(null)
  const value = useCssVar(variable, el)

  return (
    <div ref={setEl} className="flex items-center gap-3">
      <div
        className="border-border size-10 shrink-0 rounded-md border"
        style={{ backgroundColor: value || 'transparent' }}
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-col">
        <code className="text-sm">{label ?? variable}</code>
        <code className="text-muted-foreground text-xs">{value || '(not set)'}</code>
      </div>
    </div>
  )
}
