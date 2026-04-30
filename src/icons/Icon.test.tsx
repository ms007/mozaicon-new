import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Icon } from '@/icons/Icon'

function svg(container: HTMLElement) {
  const el = container.querySelector('svg')
  if (!el) throw new Error('SVG element not found')
  return el
}

describe('Icon', () => {
  it('renders an SVG with DS default attributes', () => {
    const { container } = render(<Icon />)
    const el = svg(container)
    expect(el.getAttribute('viewBox')).toBe('0 0 14 14')
    expect(el.getAttribute('fill')).toBe('none')
    expect(el.getAttribute('stroke')).toBe('currentColor')
    expect(el.getAttribute('stroke-linecap')).toBe('round')
    expect(el.getAttribute('stroke-linejoin')).toBe('round')
  })

  it('applies a default strokeWidth of 1.5', () => {
    const { container } = render(<Icon />)
    const el = svg(container)
    expect(el.getAttribute('stroke-width')).toBe('1.5')
  })

  it('forwards className to the SVG element', () => {
    const { container } = render(<Icon className="h-4 w-4 text-red-500" />)
    const el = svg(container)
    expect(el.getAttribute('class')).toContain('text-red-500')
    expect(el.getAttribute('class')).toContain('w-4')
    expect(el.getAttribute('class')).toContain('h-4')
  })

  it('respects a strokeWidth override', () => {
    const { container } = render(<Icon strokeWidth={2} />)
    const el = svg(container)
    expect(el.getAttribute('stroke-width')).toBe('2')
  })

  it('renders passed <path> children unchanged', () => {
    const { container } = render(
      <Icon>
        <path d="M0 0L14 14" />
        <path d="M14 0L0 14" />
      </Icon>,
    )
    const el = svg(container)
    const paths = el.querySelectorAll('path')
    expect(paths).toHaveLength(2)
    expect(paths[0].getAttribute('d')).toBe('M0 0L14 14')
    expect(paths[1].getAttribute('d')).toBe('M14 0L0 14')
  })

  it('renders with no children', () => {
    const { container } = render(<Icon />)
    const el = svg(container)
    expect(el.childElementCount).toBe(0)
  })

  it('sets default width and height to 14', () => {
    const { container } = render(<Icon />)
    const el = svg(container)
    expect(el.getAttribute('width')).toBe('14')
    expect(el.getAttribute('height')).toBe('14')
  })

  it('forwards additional SVG props like aria-label', () => {
    const { container } = render(<Icon aria-label="Close" />)
    const el = svg(container)
    expect(el.getAttribute('aria-label')).toBe('Close')
  })

  it('renders strokeWidth={0} without falling back to the default', () => {
    const { container } = render(<Icon strokeWidth={0} />)
    const el = svg(container)
    expect(el.getAttribute('stroke-width')).toBe('0')
  })

  it('allows DS attribute overrides via the props spread for escape-hatch usage', () => {
    const { container } = render(<Icon fill="red" viewBox="0 0 24 24" />)
    const el = svg(container)
    expect(el.getAttribute('fill')).toBe('red')
    expect(el.getAttribute('viewBox')).toBe('0 0 24 24')
  })

  it('omits the class attribute when className is not provided', () => {
    const { container } = render(<Icon />)
    const el = svg(container)
    expect(el.hasAttribute('class')).toBe(false)
  })
})
