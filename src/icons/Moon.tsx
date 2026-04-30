import type { ComponentProps } from 'react'

import { Icon } from './Icon'

export function Moon(props: ComponentProps<typeof Icon>) {
  return (
    <Icon strokeWidth={1.5} {...props}>
      <path d="M10.5 9.5A5 5 0 0 1 4.5 3.5 5 5 0 1 0 10.5 9.5z" />
    </Icon>
  )
}
