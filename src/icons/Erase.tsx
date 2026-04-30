import type { ComponentProps } from 'react'

import { Icon } from './Icon'

export function Erase(props: ComponentProps<typeof Icon>) {
  return (
    <Icon strokeWidth={1.3} {...props}>
      <path d="M5 12.5 11.5 6a1 1 0 0 0 0-1.4l-1.1-1.1a1 1 0 0 0-1.4 0L2.5 10a1 1 0 0 0 0 1.4l1.1 1.1a1 1 0 0 0 1.4 0z" />
      <path d="M3 12.5h9" />
    </Icon>
  )
}
