/** Read a CSS custom property from an element (defaults to `:root`). */
export function getCssVar(name: string, el?: Element | null): string | undefined {
  if (typeof window === 'undefined') return undefined
  const target = el ?? document.documentElement
  const raw = getComputedStyle(target).getPropertyValue(name).trim()
  return raw || undefined
}

/**
 * Parse a CSS rem/px value into a pixel number.
 * Returns `undefined` for values it cannot handle.
 */
export function cssLengthToPx(value: string): number | undefined {
  const trimmed = value.trim()
  const remMatch = /^([\d.]+)rem$/.exec(trimmed)
  if (remMatch) {
    const rootFontSize =
      typeof window !== 'undefined'
        ? parseFloat(getComputedStyle(document.documentElement).fontSize)
        : 16
    return parseFloat(remMatch[1]) * rootFontSize
  }
  const pxMatch = /^([\d.]+)px$/.exec(trimmed)
  if (pxMatch) return parseFloat(pxMatch[1])
  return undefined
}

/**
 * Resolve the computed pixel size for a spacing multiplier.
 * Reads `--spacing` from the element (or `:root`) and multiplies.
 */
export function resolveSpacing(
  multiplier: number,
  el?: Element | null,
): { raw: string; px: number } | undefined {
  const base = getCssVar('--spacing', el)
  if (!base) return undefined
  const basePx = cssLengthToPx(base)
  if (basePx == null) return undefined
  const px = basePx * multiplier
  const raw = base.endsWith('rem')
    ? `${String(parseFloat(base) * multiplier)}rem`
    : `${String(px)}px`
  return { raw, px }
}
