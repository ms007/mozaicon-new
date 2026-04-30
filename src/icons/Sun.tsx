import type { ComponentProps } from 'react'

import { Icon } from './Icon'

export function Sun(props: ComponentProps<typeof Icon>) {
  return (
    <Icon strokeWidth={1.5} {...props}>
      <circle cx="7" cy="7" r="2.5" />
      <path d="M7 1.5v1M7 11.5v1M1.5 7h1M11.5 7h1M3.1 3.1l.7.7M10.2 10.2l.7.7M10.2 3.8l.7-.7M3.1 10.9l.7-.7" />
    </Icon>
  )
}
