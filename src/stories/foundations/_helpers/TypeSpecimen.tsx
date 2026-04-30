import { useCallback } from 'react'

import { resolveToken } from './resolve-token'
import { useThemeReactiveToken } from './useThemeReactiveToken'

export type { TypeSpecimenProps }

interface TypeSpecimenProps {
  /** CSS custom property for font-size, e.g. "--text-base" */
  sizeVar: string
  /** Display label shown in the specimen header, e.g. "text-base" */
  label: string
  /** Sample text rendered at the resolved size */
  sampleText?: string
  /** CSS custom property for font-family, e.g. "--font-sans" */
  fontFamilyVar?: string
  /** CSS custom property for font-weight */
  fontWeightVar?: string
}

interface ResolvedTokens {
  fontSize: string
  lineHeight: string
  fontFamily: string
  fontWeight: string
}

const FALLBACK_SIZE = '1rem'
const FALLBACK_LINE_HEIGHT = '1.5'
const DEFAULT_SAMPLE = 'The quick brown fox jumps over the lazy dog'

function readTokens(
  sizeVar: string,
  fontFamilyVar?: string,
  fontWeightVar?: string,
): ResolvedTokens {
  const el = document.documentElement
  return {
    fontSize: resolveToken(el, sizeVar, FALLBACK_SIZE),
    lineHeight: resolveToken(el, `${sizeVar}--line-height`, FALLBACK_LINE_HEIGHT),
    fontFamily: fontFamilyVar ? resolveToken(el, fontFamilyVar) : '',
    fontWeight: fontWeightVar ? resolveToken(el, fontWeightVar) : '',
  }
}

export function TypeSpecimen({
  sizeVar,
  label,
  sampleText = DEFAULT_SAMPLE,
  fontFamilyVar,
  fontWeightVar,
}: TypeSpecimenProps) {
  const compute = useCallback(
    () => readTokens(sizeVar, fontFamilyVar, fontWeightVar),
    [sizeVar, fontFamilyVar, fontWeightVar],
  )
  const tokens = useThemeReactiveToken<ResolvedTokens>(compute)

  const meta = tokens.lineHeight ? `${tokens.fontSize} / ${tokens.lineHeight}` : tokens.fontSize

  return (
    <div
      style={{
        borderBottom: '1px solid var(--border)',
        padding: '1rem 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.25rem',
        }}
      >
        <code
          style={{
            fontSize: '0.6875rem',
            color: 'var(--muted-foreground)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {label}
        </code>
        <span
          data-testid="specimen-meta"
          style={{
            fontSize: '0.6875rem',
            color: 'var(--muted-foreground)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {meta}
        </span>
      </div>
      <p
        data-testid="specimen-sample"
        style={{
          fontSize: tokens.fontSize || undefined,
          lineHeight: tokens.lineHeight || undefined,
          fontFamily: tokens.fontFamily || undefined,
          fontWeight: tokens.fontWeight || undefined,
          margin: 0,
          color: 'var(--foreground)',
        }}
      >
        {sampleText}
      </p>
    </div>
  )
}
