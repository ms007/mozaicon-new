import { Icon, type IconProps } from './Icon'

export function Redo(props: Omit<IconProps, 'children'>) {
  return (
    <Icon strokeWidth={1.5} {...props}>
      <path d="M12 5H5a3 3 0 0 0 0 6h2" />
      <path d="M9 2l3 3-3 3" />
    </Icon>
  )
}
