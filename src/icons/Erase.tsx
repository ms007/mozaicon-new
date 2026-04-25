import { Icon, type IconProps } from './Icon'

export function Erase(props: Omit<IconProps, 'children'>) {
  return (
    <Icon strokeWidth={1.3} {...props}>
      <path d="M3 10.5L8.5 5l3 3L6 13.5H3v-3z" />
      <path d="M2 13.5h10" />
    </Icon>
  )
}
