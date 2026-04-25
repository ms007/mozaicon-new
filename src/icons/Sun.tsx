import { Icon, type IconProps } from './Icon'

export function Sun(props: Omit<IconProps, 'children'>) {
  return (
    <Icon strokeWidth={1.5} {...props}>
      <circle cx="7" cy="7" r="2.5" />
      <path d="M7 1.5v1M7 11.5v1M1.5 7h1M11.5 7h1M3.1 3.1l.8.8M10.1 10.1l.8.8M10.1 3.9l.8-.8M3.1 10.9l.8-.8" />
    </Icon>
  )
}
