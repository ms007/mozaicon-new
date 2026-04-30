import { useEffect, useMemo, useReducer } from 'react'

/**
 * Re-runs `compute` whenever the `class` attribute on `<html>` mutates.
 * Stabilise `compute` at the call site (e.g. via `useCallback`) — a fresh
 * closure each render defeats the memoisation.
 */
export function useThemeReactiveToken<T>(compute: () => T): T {
  const [themeVersion, bumpVersion] = useReducer((v: number) => v + 1, 0)

  useEffect(() => {
    const observer = new MutationObserver(() => {
      bumpVersion()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => {
      observer.disconnect()
    }
  }, [])

  // themeVersion drives re-evaluation on class mutation; the lint rule can't
  // see that compute reads from CSS-class-driven state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => compute(), [compute, themeVersion])
}
