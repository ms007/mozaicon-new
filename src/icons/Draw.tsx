import { Icon, type IconProps } from './Icon'

export function Draw(props: Omit<IconProps, 'children'>) {
  return (
    <Icon strokeWidth={1.3} {...props}>
      <path d="M2.5 11.5l6.4-6.4a1 1 0 0 1 1.4 0l.6.6a1 1 0 0 1 0 1.4L4.5 13.5H2.5v-2z" />
      <path d="M8 6l2 2" />
    </Icon>
  )
}
