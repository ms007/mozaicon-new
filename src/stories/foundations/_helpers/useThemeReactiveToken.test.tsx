import { act, renderHook } from '@testing-library/react'
import { useCallback } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useThemeReactiveToken } from './useThemeReactiveToken'

afterEach(() => {
  document.documentElement.className = ''
  document.documentElement.style.cssText = ''
  vi.restoreAllMocks()
})

describe('useThemeReactiveToken', () => {
  it('returns the result of the compute function on first render', () => {
    const { result } = renderHook(() => useThemeReactiveToken(() => 'hello'))
    expect(result.current).toBe('hello')
  })

  it('re-runs compute when the html class attribute mutates', async () => {
    let value = 'light'
    const { result } = renderHook(() => useThemeReactiveToken(() => value))
    expect(result.current).toBe('light')

    value = 'dark'
    await act(async () => {
      document.documentElement.classList.add('dark')
      await Promise.resolve()
    })

    expect(result.current).toBe('dark')
  })

  it('only fires for class mutations, not other attributes', async () => {
    const compute = vi.fn(() => 'value')
    renderHook(() => useThemeReactiveToken(compute))
    const initialCalls = compute.mock.calls.length

    await act(async () => {
      document.documentElement.setAttribute('data-foo', 'bar')
      await Promise.resolve()
    })

    expect(compute.mock.calls.length).toBe(initialCalls)
  })

  it('re-resolves when the compute identity changes', () => {
    const { result, rerender } = renderHook(
      ({ token }: { token: string }) => useThemeReactiveToken(useCallback(() => token, [token])),
      { initialProps: { token: 'a' } },
    )
    expect(result.current).toBe('a')

    rerender({ token: 'b' })
    expect(result.current).toBe('b')
  })

  it('disconnects the observer on unmount', () => {
    const disconnect = vi.fn()
    const observe = vi.fn()
    const OriginalMutationObserver = global.MutationObserver
    // @ts-expect-error -- minimal constructor stub, not the full DOM type
    global.MutationObserver = class {
      observe = observe
      disconnect = disconnect
    }

    const { unmount } = renderHook(() => useThemeReactiveToken(() => 'x'))
    expect(observe).toHaveBeenCalledTimes(1)
    unmount()
    expect(disconnect).toHaveBeenCalledTimes(1)

    global.MutationObserver = OriginalMutationObserver
  })
})
