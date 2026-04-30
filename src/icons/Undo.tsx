import type { ComponentProps } from 'react'

import { Icon } from './Icon'

export function Undo(props: ComponentProps<typeof Icon>) {
  return (
    <Icon strokeWidth={1.5} {...props}>
      <path d="M2 5h7a3 3 0 0 1 0 6H6" />
      <path d="M5 2 2 5l3 3" />
    </Icon>
  )
}
