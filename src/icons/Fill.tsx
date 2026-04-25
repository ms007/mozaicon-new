import { Icon, type IconProps } from './Icon'

export function Fill(props: Omit<IconProps, 'children'>) {
  return (
    <Icon strokeWidth={1.3} {...props}>
      <path d="M3.5 10L8 2l4.5 8a4.5 4.5 0 0 1-9 0z" />
    </Icon>
  )
}
