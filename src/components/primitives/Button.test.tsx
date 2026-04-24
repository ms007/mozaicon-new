import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button, type ButtonSize, type ButtonVariant } from '@/components/primitives/Button'

const VARIANTS: ButtonVariant[] = ['default', 'primary', 'ghost', 'destructive']
const SIZES: ButtonSize[] = ['default', 'sm', 'xs', 'icon', 'icon-sm', 'icon-xs']

describe('Button', () => {
  it('renders as a <button> with default variant and size', () => {
    render(<Button>Click</Button>)
    const button = screen.getByRole('button', { name: 'Click' })
    expect(button.tagName).toBe('BUTTON')
    expect(button.getAttribute('data-variant')).toBe('default')
    expect(button.getAttribute('data-size')).toBe('default')
  })

  describe.each(VARIANTS)('variant "%s"', (variant) => {
    it('renders with the matching data-variant attribute', () => {
      render(<Button variant={variant}>Label</Button>)
      expect(screen.getByRole('button').getAttribute('data-variant')).toBe(variant)
    })
  })

  describe.each(SIZES)('size "%s"', (size) => {
    it('renders with the matching data-size attribute', () => {
      render(<Button size={size} aria-label="Icon button" />)
      expect(screen.getByRole('button').getAttribute('data-size')).toBe(size)
    })
  })

  it('sets aria-pressed="true" when pressed is true', () => {
    render(<Button pressed>Toggle</Button>)
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true')
  })

  it('sets aria-pressed="false" when pressed is false', () => {
    render(<Button pressed={false}>Toggle</Button>)
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('false')
  })

  it('omits aria-pressed when pressed is undefined', () => {
    render(<Button>Toggle</Button>)
    expect(screen.getByRole('button').hasAttribute('aria-pressed')).toBe(false)
  })

  it('keys pressed-state styling off aria-pressed (aria-pressed:* utilities in base class list, unchanged by pressed)', () => {
    const { rerender } = render(
      <Button className="extra" pressed={false}>
        Toggle
      </Button>,
    )
    const notPressed = screen.getByRole('button').className
    expect(notPressed).toContain('aria-pressed:bg-primary-muted')
    rerender(
      <Button className="extra" pressed>
        Toggle
      </Button>,
    )
    const pressed = screen.getByRole('button').className
    expect(pressed).toContain('aria-pressed:bg-primary-muted')
    expect(pressed).toBe(notPressed)
  })

  it('forwards props to a custom child element when asChild is set', () => {
    render(
      <Button asChild variant="primary">
        <a href="/export">Export</a>
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'Export' })
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('/export')
    expect(link.getAttribute('data-variant')).toBe('primary')
    expect(link.getAttribute('data-slot')).toBe('button')
  })

  it('fires the click handler on user click', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('suppresses the click handler when disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Click
      </Button>,
    )
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('applies the active:scale-[0.97] press affordance in the base class list', () => {
    render(<Button>Press</Button>)
    expect(screen.getByRole('button').className).toContain('active:scale-[0.97]')
  })
})
