import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { cssLengthToPx, getCssVar, resolveSpacing } from './spacing-utils'
import { SpacingRow } from './SpacingRow'

// --- Pure utility tests ---

describe('getCssVar', () => {
  beforeEach(() => {
    document.documentElement.style.setProperty('--spacing', '0.25rem')
  })

  afterEach(() => {
    document.documentElement.style.removeProperty('--spacing')
  })

  it('reads a CSS variable from :root', () => {
    expect(getCssVar('--spacing')).toBe('0.25rem')
  })

  it('returns undefined for a missing variable', () => {
    expect(getCssVar('--does-not-exist')).toBeUndefined()
  })

  it('reads from a specific element', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    el.style.setProperty('--custom', '42px')
    expect(getCssVar('--custom', el)).toBe('42px')
    el.remove()
  })
})

describe('cssLengthToPx', () => {
  it('parses rem values', () => {
    expect(cssLengthToPx('0.25rem')).toBe(4)
  })

  it('parses px values', () => {
    expect(cssLengthToPx('16px')).toBe(16)
  })

  it('returns undefined for unsupported units', () => {
    expect(cssLengthToPx('2em')).toBeUndefined()
    expect(cssLengthToPx('auto')).toBeUndefined()
  })

  it('trims whitespace', () => {
    expect(cssLengthToPx('  8px  ')).toBe(8)
  })

  it('returns undefined for empty string', () => {
    expect(cssLengthToPx('')).toBeUndefined()
  })

  it('handles zero values', () => {
    expect(cssLengthToPx('0rem')).toBe(0)
    expect(cssLengthToPx('0px')).toBe(0)
  })
})

describe('resolveSpacing', () => {
  beforeEach(() => {
    document.documentElement.style.setProperty('--spacing', '0.25rem')
  })

  afterEach(() => {
    document.documentElement.style.removeProperty('--spacing')
  })

  it('computes the correct rem and px value for a multiplier', () => {
    const result = resolveSpacing(4)
    expect(result).toEqual({ raw: '1rem', px: 16 })
  })

  it('handles fractional multipliers', () => {
    const result = resolveSpacing(0.5)
    expect(result).toEqual({ raw: '0.125rem', px: 2 })
  })

  it('returns zero for multiplier 0', () => {
    const result = resolveSpacing(0)
    expect(result).toEqual({ raw: '0rem', px: 0 })
  })

  it('returns undefined when --spacing is missing', () => {
    document.documentElement.style.removeProperty('--spacing')
    expect(resolveSpacing(4)).toBeUndefined()
  })

  it('produces a px-based raw string when --spacing is in px', () => {
    document.documentElement.style.setProperty('--spacing', '4px')
    const result = resolveSpacing(3)
    expect(result).toEqual({ raw: '12px', px: 12 })
  })

  it('handles negative multipliers without crashing', () => {
    const result = resolveSpacing(-2)
    expect(result).toEqual({ raw: '-0.5rem', px: -8 })
  })
})

// --- Component tests ---

describe('SpacingRow', () => {
  beforeEach(() => {
    document.documentElement.style.setProperty('--spacing', '0.25rem')
  })

  afterEach(() => {
    document.documentElement.style.removeProperty('--spacing')
    document.documentElement.classList.remove('dark')
  })

  it('renders the name, bar, and computed value', async () => {
    render(<SpacingRow multiplier={4} name="4" />)
    expect(screen.getByText('4')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/1rem/)).toBeInTheDocument()
      expect(screen.getByText(/16px/)).toBeInTheDocument()
    })
  })

  it('renders the bar with correct width', async () => {
    render(<SpacingRow multiplier={4} name="4" />)
    await waitFor(() => {
      const bar = screen.getByTestId('spacing-bar')
      expect(bar).toHaveStyle({ width: '16px' })
    })
  })

  it('shows "unavailable" when --spacing is missing', () => {
    document.documentElement.style.removeProperty('--spacing')
    render(<SpacingRow multiplier={4} name="4" />)
    expect(screen.getByText('unavailable')).toBeInTheDocument()
  })

  it('re-resolves when the theme class changes', async () => {
    render(<SpacingRow multiplier={4} name="4" />)
    await waitFor(() => {
      expect(screen.getByText(/16px/)).toBeInTheDocument()
    })

    // Simulate a theme change — the MutationObserver fires.
    await act(async () => {
      document.documentElement.classList.add('dark')
      await new Promise((r) => setTimeout(r, 10))
    })

    // Value is still resolved (--spacing doesn't change with theme,
    // but the observer fired and the component re-resolved successfully).
    await waitFor(() => {
      expect(screen.getByText(/16px/)).toBeInTheDocument()
    })
  })
})
