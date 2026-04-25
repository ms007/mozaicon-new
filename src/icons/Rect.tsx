import { Icon, type IconProps } from './Icon'

export function Rect(props: Omit<IconProps, 'children'>) {
  return (
    <Icon strokeWidth={1.3} {...props}>
      <rect x="2" y="2" width="10" height="10" rx="1" />
    </Icon>
  )
}
