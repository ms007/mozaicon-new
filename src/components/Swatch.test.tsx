import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Swatch } from '@/components/Swatch'

function swatch() {
  const el = document.querySelector<HTMLButtonElement>('[data-slot="swatch"]')
  if (!el) throw new Error('Swatch element not found')
  return el
}

describe('Swatch', () => {
  it('renders a 20×20 button displaying the given color', () => {
    render(<Swatch color="#ef4444" />)
    const el = swatch()
    expect(el.tagName).toBe('BUTTON')
    expect(el.className).toContain('size-5')
    expect(el.style.backgroundColor).toBe('#ef4444')
  })

  it('fires onSelect when clicked', async () => {
    const onSelect = vi.fn()
    render(<Swatch color="#000" onSelect={onSelect} />)

    await userEvent.click(swatch())

    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('reflects the `active` prop on the `data-active` attribute', () => {
    const { rerender } = render(<Swatch color="#000" />)
    expect(swatch().dataset.active).toBe('false')

    rerender(<Swatch color="#000" active />)
    expect(swatch().dataset.active).toBe('true')

    rerender(<Swatch color="#000" active={false} />)
    expect(swatch().dataset.active).toBe('false')
  })

  it('gates the primary-colored outer border behind `data-[active=true]`', () => {
    render(<Swatch color="#000" active />)
    // Behaviour lives in the Tailwind variant — assert both the class and the
    // attribute it selects on; the visual result is covered by Playwright.
    const el = swatch()
    expect(el.className).toContain('data-[active=true]:border-primary')
    expect(el.dataset.active).toBe('true')
  })

  it('mirrors `active` onto `aria-pressed` and falls back to color for aria-label', () => {
    render(<Swatch color="#3b82f6" active />)
    const el = swatch()
    expect(el.getAttribute('aria-pressed')).toBe('true')
    expect(el.getAttribute('aria-label')).toBe('#3b82f6')
  })

  it('does not throw when clicked without an `onSelect` handler', async () => {
    render(<Swatch color="#000" />)
    await userEvent.click(swatch())
  })
})
