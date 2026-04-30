import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { TokenSwatch } from './TokenSwatch'

describe('TokenSwatch', () => {
  afterEach(() => {
    document.documentElement.style.cssText = ''
    document.documentElement.className = ''
  })

  it('resolves a CSS variable and displays its value', () => {
    document.documentElement.style.setProperty('--test-color', '#6366f1')
    render(<TokenSwatch variable="--test-color" />)

    expect(screen.getByTestId('swatch-value')).toHaveTextContent('#6366f1')
    expect(screen.getByTestId('swatch-preview').style.backgroundColor).toBe('#6366f1')
  })

  it('renders the optional label alongside the variable name', () => {
    document.documentElement.style.setProperty('--test-color', 'red')
    render(<TokenSwatch variable="--test-color" label="Primary" />)

    expect(screen.getByText('Primary')).toBeInTheDocument()
    expect(screen.getByText('--test-color')).toBeInTheDocument()
  })

  it('falls back gracefully when the variable is absent', () => {
    render(<TokenSwatch variable="--nonexistent" />)

    expect(screen.getByTestId('swatch-value')).toHaveTextContent('unset')
    expect(screen.getByTestId('swatch-preview').style.backgroundColor).toBe('transparent')
  })

  it('reflects updates when an ancestor toggles .dark', async () => {
    document.documentElement.style.setProperty('--theme-color', 'blue')
    render(<TokenSwatch variable="--theme-color" />)
    expect(screen.getByTestId('swatch-value')).toHaveTextContent('blue')

    // Simulate a theme switch: update the variable value and toggle the class.
    // The MutationObserver fires on the class change, triggering re-resolution.
    document.documentElement.style.setProperty('--theme-color', 'red')
    document.documentElement.classList.add('dark')

    await waitFor(() => {
      expect(screen.getByTestId('swatch-value')).toHaveTextContent('red')
    })
  })

  it('re-resolves when the variable prop changes', () => {
    document.documentElement.style.setProperty('--a', 'tomato')
    document.documentElement.style.setProperty('--b', 'skyblue')

    const { rerender } = render(<TokenSwatch variable="--a" />)
    expect(screen.getByTestId('swatch-value')).toHaveTextContent('tomato')

    rerender(<TokenSwatch variable="--b" />)
    expect(screen.getByTestId('swatch-value')).toHaveTextContent('skyblue')
  })
})
