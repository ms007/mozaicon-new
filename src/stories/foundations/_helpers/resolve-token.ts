/**
 * Reads a CSS custom property value from the computed style of an element.
 * Returns `fallback` when the variable is unset or empty.
 */
export function resolveToken(el: Element, varName: string, fallback = ''): string {
  const value = getComputedStyle(el).getPropertyValue(varName).trim()
  return value || fallback
}
