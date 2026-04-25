import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Icon } from '@/icons/Icon'

function svg() {
  const el = document.querySelector('svg')
  if (!el) throw new Error('SVG element not found')
  return el
}

describe('Icon', () => {
  it('applies DS default attributes', () => {
    render(
      <Icon>
        <path d="M1 1L13 13" />
      </Icon>,
    )
    const el = svg()
    expect(el.getAttribute('viewBox')).toBe('0 0 14 14')
    expect(el.getAttribute('fill')).toBe('none')
    expect(el.getAttribute('stroke')).toBe('currentColor')
    expect(el.getAttribute('stroke-linecap')).toBe('round')
    expect(el.getAttribute('stroke-linejoin')).toBe('round')
    expect(el.getAttribute('stroke-width')).toBe('1.5')
  })

  it('forwards className', () => {
    render(
      <Icon className="text-red-500">
        <path d="M1 1L13 13" />
      </Icon>,
    )
    expect(svg().classList.contains('text-red-500')).toBe(true)
  })

  it('respects stroke-width override', () => {
    render(
      <Icon strokeWidth={1.3}>
        <path d="M1 1L13 13" />
      </Icon>,
    )
    expect(svg().getAttribute('stroke-width')).toBe('1.3')
  })

  it('forwards additional SVG attributes', () => {
    render(
      <Icon aria-label="icon" data-testid="my-icon">
        <path d="M1 1L13 13" />
      </Icon>,
    )
    const el = svg()
    expect(el.getAttribute('aria-label')).toBe('icon')
    expect(el.getAttribute('data-testid')).toBe('my-icon')
  })

  it('renders children unchanged', () => {
    render(
      <Icon>
        <path d="M2 7h10" />
        <circle cx="7" cy="7" r="3" />
      </Icon>,
    )
    const el = svg()
    expect(el.querySelector('path')?.getAttribute('d')).toBe('M2 7h10')
    expect(el.querySelector('circle')?.getAttribute('cx')).toBe('7')
  })
})
