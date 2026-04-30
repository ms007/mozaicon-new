import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RadiusSwatch } from './RadiusSwatch'

/** Stub `getComputedStyle` so we can control the value of CSS custom properties. */
function mockCssVar(vars: Record<string, string>) {
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    getPropertyValue: (prop: string) => vars[prop] ?? '',
  } as CSSStyleDeclaration)
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  // Reset any class mutations from MutationObserver tests.
  document.documentElement.className = ''
})

describe('RadiusSwatch', () => {
  it('resolves a CSS custom property and applies it as border-radius', () => {
    mockCssVar({ '--radius-lg': '6px' })

    render(<RadiusSwatch token="--radius-lg" label="lg" />)

    const swatch = screen.getByTestId('radius-swatch')
    expect(swatch.style.borderRadius).toBe('6px')
  })

  it('displays the token name and resolved value', () => {
    mockCssVar({ '--radius-md': '4px' })

    render(<RadiusSwatch token="--radius-md" label="md" />)

    expect(screen.getByText('md')).toBeInTheDocument()
    expect(screen.getByText('--radius-md')).toBeInTheDocument()
    expect(screen.getByText('4px')).toBeInTheDocument()
  })

  it('shows a fallback when the CSS variable is missing', () => {
    mockCssVar({})

    render(<RadiusSwatch token="--radius-nope" label="nope" />)

    const swatch = screen.getByTestId('radius-swatch')
    expect(swatch.style.borderRadius).toBe('0px')
    expect(screen.getByText('–')).toBeInTheDocument()
  })

  it('treats a whitespace-only CSS value as missing', () => {
    mockCssVar({ '--radius-sm': '   ' })

    render(<RadiusSwatch token="--radius-sm" label="sm" />)

    const swatch = screen.getByTestId('radius-swatch')
    expect(swatch.style.borderRadius).toBe('0px')
    expect(screen.getByText('–')).toBeInTheDocument()
  })

  it('re-renders when the html class attribute changes (MutationObserver)', async () => {
    mockCssVar({ '--radius-lg': '6px' })
    render(<RadiusSwatch token="--radius-lg" label="lg" />)
    expect(screen.getByText('6px')).toBeInTheDocument()

    // Swap the mock to return a new value, then trigger the observer.
    mockCssVar({ '--radius-lg': '10px' })
    act(() => {
      document.documentElement.classList.add('dark')
    })

    await waitFor(() => {
      expect(screen.getByText('10px')).toBeInTheDocument()
    })
    const swatch = screen.getByTestId('radius-swatch')
    expect(swatch.style.borderRadius).toBe('10px')
  })

  it('re-resolves when the token prop changes', () => {
    mockCssVar({ '--radius-lg': '6px', '--radius-md': '4px' })
    const { rerender } = render(<RadiusSwatch token="--radius-lg" label="lg" />)

    expect(screen.getByText('6px')).toBeInTheDocument()

    rerender(<RadiusSwatch token="--radius-md" label="md" />)

    expect(screen.getByText('4px')).toBeInTheDocument()
    const swatch = screen.getByTestId('radius-swatch')
    expect(swatch.style.borderRadius).toBe('4px')
  })
})
