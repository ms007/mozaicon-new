import type { ComponentProps } from 'react'

import { Icon } from './Icon'

export function Draw(props: ComponentProps<typeof Icon>) {
  return (
    <Icon strokeWidth={1.3} {...props}>
      <path d="M2.5 11.5 9.8 4.2a1 1 0 0 1 1.4 0l.6.6a1 1 0 0 1 0 1.4L4.5 13.5 1.5 14z" />
      <path d="M8.5 5.5l2 2" />
    </Icon>
  )
}
