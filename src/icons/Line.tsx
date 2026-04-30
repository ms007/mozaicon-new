import type { ComponentProps } from 'react'

import { Icon } from './Icon'

export function Line(props: ComponentProps<typeof Icon>) {
  return (
    <Icon strokeWidth={1.3} {...props}>
      <line x1="2" y1="12" x2="12" y2="2" />
    </Icon>
  )
}
