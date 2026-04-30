import type { ComponentProps } from 'react'

import { Icon } from './Icon'

export function Fill(props: ComponentProps<typeof Icon>) {
  return (
    <Icon strokeWidth={1.3} {...props}>
      <path d="M8.5 2.5 3 8a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0L11.5 5.5z" />
      <path d="M11 8.5c1 1.5 1.5 2.5 1 3.5s-1.5 1-2 0-.5-2 1-3.5" />
    </Icon>
  )
}
