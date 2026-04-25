import { Icon, type IconProps } from './Icon'

export function Moon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon strokeWidth={1.5} {...props}>
      <path d="M10.5 8.5A5 5 0 0 1 5.5 3.5 5 5 0 1 0 10.5 8.5z" />
    </Icon>
  )
}
