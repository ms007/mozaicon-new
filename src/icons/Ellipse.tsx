import type { ComponentProps } from 'react'

import { Icon } from './Icon'

export function Ellipse(props: ComponentProps<typeof Icon>) {
  return (
    <Icon strokeWidth={1.3} {...props}>
      <ellipse cx="7" cy="7" rx="5" ry="5" />
    </Icon>
  )
}
