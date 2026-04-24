// Nested-square brand logo from the DS (see `docs/design-system.html`, section
// "Brand mark"). Rendered as inline SVG so it scales crisp at any size and
// inherits color from the surrounding text via `currentColor`. The outer frame
// sits at 20% opacity; the inner canvas is solid.

import type { ComponentProps } from 'react'

export type BrandMarkProps = ComponentProps<'svg'> & {
  size?: number
}

export function BrandMark({ size = 16, ...props }: BrandMarkProps) {
  return (
    <svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      data-slot="brand-mark"
    >
      <rect x="1" y="1" width="14" height="14" rx="3" fill="currentColor" opacity="0.2" />
      <rect x="4" y="4" width="8" height="8" rx="1.5" fill="currentColor" />
    </svg>
  )
}
