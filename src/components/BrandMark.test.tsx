import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BrandMark } from '@/components/BrandMark'

function mark() {
  const el = document.querySelector<SVGSVGElement>('[data-slot="brand-mark"]')
  if (!el) throw new Error('BrandMark element not found')
  return el
}

describe('BrandMark', () => {
  it('defaults `size` to 16 and maps it onto width and height', () => {
    render(<BrandMark />)
    const el = mark()
    expect(el.getAttribute('width')).toBe('16')
    expect(el.getAttribute('height')).toBe('16')
  })

  it('maps `size` onto both width and height on the SVG', () => {
    render(<BrandMark size={64} />)
    const el = mark()
    expect(el.getAttribute('width')).toBe('64')
    expect(el.getAttribute('height')).toBe('64')
  })

  it('contains the two nested-square `<rect>` children from the DS spec', () => {
    render(<BrandMark />)
    const rects = mark().querySelectorAll('rect')
    expect(rects).toHaveLength(2)
  })

  it('uses `currentColor` for every fill so the mark inherits the surrounding color', () => {
    render(<BrandMark />)
    const rects = mark().querySelectorAll('rect')
    for (const rect of rects) {
      expect(rect.getAttribute('fill')).toBe('currentColor')
    }
  })
})
