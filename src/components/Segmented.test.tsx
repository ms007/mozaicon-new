import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Segmented, type SegmentedOption } from '@/components/Segmented'

const UNIT_OPTIONS: SegmentedOption[] = [
  { value: 'px', label: 'px' },
  { value: '%', label: '%' },
  { value: 'em', label: 'em' },
]

const noop = () => undefined

function pill() {
  const el = document.querySelector<HTMLElement>('[data-slot="segmented-pill"]')
  if (!el) throw new Error('Segmented pill not found')
  return el
}

describe('Segmented', () => {
  it('fires onChange with the segment value when a segment is clicked', async () => {
    const onChange = vi.fn()
    render(<Segmented options={UNIT_OPTIONS} value="px" onChange={onChange} />)

    await userEvent.click(screen.getByText('%'))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('%')
  })

  it('swallows Radix deselection when the active segment is re-clicked', async () => {
    const onChange = vi.fn()
    render(<Segmented options={UNIT_OPTIONS} value="px" onChange={onChange} />)

    await userEvent.click(screen.getByText('px'))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('positions the pill at `left = activeIndex/count` and `width = 1/count`', () => {
    const { rerender } = render(<Segmented options={UNIT_OPTIONS} value="px" onChange={noop} />)

    const count = UNIT_OPTIONS.length
    const pct = (index: number) => `${((index / count) * 100).toString()}%`

    expect(pill().style.left).toBe(pct(0))
    expect(pill().style.width).toBe(pct(1))

    rerender(<Segmented options={UNIT_OPTIONS} value="%" onChange={noop} />)
    expect(pill().style.left).toBe(pct(1))
    expect(pill().style.width).toBe(pct(1))

    rerender(<Segmented options={UNIT_OPTIONS} value="em" onChange={noop} />)
    expect(pill().style.left).toBe(pct(2))
    expect(pill().style.width).toBe(pct(1))
  })

  it('applies the `duration-200 ease-out` transition on the pill', () => {
    render(<Segmented options={UNIT_OPTIONS} value="px" onChange={noop} />)
    const className = pill().className
    expect(className).toContain('duration-200')
    expect(className).toContain('ease-out')
  })

  it('hides the pill when `value` is not in options', () => {
    render(<Segmented options={UNIT_OPTIONS} value="rem" onChange={noop} />)
    expect(pill().className).toContain('opacity-0')
  })

  it('selects the next segment via keyboard arrow navigation (inherited from ToggleGroup)', async () => {
    const onChange = vi.fn()
    render(<Segmented options={UNIT_OPTIONS} value="px" onChange={onChange} />)

    // Roving focus: the active item is the tab-stop. Focus it, arrow-right
    // moves focus, Space activates the newly focused item.
    const active = screen.getByText('px').closest('button')
    if (!active) throw new Error('Active segment button not found')
    active.focus()

    await userEvent.keyboard('{ArrowRight}')
    await userEvent.keyboard(' ')

    expect(onChange).toHaveBeenCalledWith('%')
  })
})
