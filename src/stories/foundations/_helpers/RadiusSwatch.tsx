import { useState } from 'react'

import { useCssVar } from './useCssVar'

interface RadiusSwatchProps {
  variable: string
  label?: string
}

export function RadiusSwatch({ variable, label }: RadiusSwatchProps) {
  const [el, setEl] = useState<HTMLDivElement | null>(null)
  const value = useCssVar(variable, el)

  return (
    <div ref={setEl} className="flex items-center gap-3 py-2">
      <div
        className="border-primary bg-primary-muted size-16 shrink-0 border-2"
        style={{ borderRadius: value || '0' }}
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-col">
        <code className="text-sm">{label ?? variable}</code>
        <code className="text-muted-foreground text-xs">{value || '(not set)'}</code>
      </div>
    </div>
  )
}
