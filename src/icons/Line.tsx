import { Icon, type IconProps } from './Icon'

export function Line(props: Omit<IconProps, 'children'>) {
  return (
    <Icon strokeWidth={1.3} {...props}>
      <path d="M2 12L12 2" />
    </Icon>
  )
}
