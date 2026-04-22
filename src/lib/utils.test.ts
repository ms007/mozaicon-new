import { describe, expect, it } from 'vitest'

import { cn } from './utils'

describe('cn', () => {
  it('merges conditional class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('dedupes conflicting tailwind classes, last wins', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('drops falsy entries', () => {
    const disabled = false as boolean
    expect(cn('px-2', disabled && 'hidden', undefined, null, 'py-1')).toBe('px-2 py-1')
  })
})
