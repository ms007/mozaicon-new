import { Icon, type IconProps } from './Icon'

export function Ellipse(props: Omit<IconProps, 'children'>) {
  return (
    <Icon strokeWidth={1.3} {...props}>
      <ellipse cx="7" cy="7" rx="5" ry="4" />
    </Icon>
  )
}
