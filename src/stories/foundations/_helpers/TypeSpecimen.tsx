import { useState } from 'react'

import { useCssVar } from './useCssVar'

interface TypeSpecimenProps {
  sizeVar: string
  lineHeightVar?: string
  label?: string
  weight?: number
}

export function TypeSpecimen({ sizeVar, lineHeightVar, label, weight = 400 }: TypeSpecimenProps) {
  const [el, setEl] = useState<HTMLDivElement | null>(null)
  const fontSize = useCssVar(sizeVar, el)
  const lineHeight = useCssVar(lineHeightVar ?? '', el)

  return (
    <div ref={setEl} className="border-border border-b py-3">
      <p
        className="text-foreground"
        style={{
          fontSize: fontSize || undefined,
          lineHeight: lineHeight || undefined,
          fontWeight: weight,
        }}
      >
        {label ?? 'The quick brown fox jumps over the lazy dog'}
      </p>
      <code className="text-muted-foreground text-xs">
        {fontSize || '(not set)'}
        {lineHeight ? ` / ${lineHeight}` : ''}
        {weight !== 400 ? ` · weight ${String(weight)}` : ''}
      </code>
    </div>
  )
}
