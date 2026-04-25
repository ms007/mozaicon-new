import { Icon, type IconProps } from './Icon'

export function Undo(props: Omit<IconProps, 'children'>) {
  return (
    <Icon strokeWidth={1.5} {...props}>
      <path d="M2 5h7a3 3 0 0 1 0 6H8" />
      <path d="M5 2L2 5l3 3" />
    </Icon>
  )
}
