import type { ComponentProps } from 'react'

import { Icon } from './Icon'

export function Rect(props: ComponentProps<typeof Icon>) {
  return (
    <Icon strokeWidth={1.3} {...props}>
      <rect x="2" y="2" width="10" height="10" rx="1" />
    </Icon>
  )
}
