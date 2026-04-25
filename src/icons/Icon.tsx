import type { ComponentProps, ReactNode } from 'react'

export type IconProps = Omit<ComponentProps<'svg'>, 'children'> & {
  children: ReactNode
  strokeWidth?: number
}

export function Icon({ children, className, strokeWidth = 1.5, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      className={className}
      {...props}
    >
      {children}
    </svg>
  )
}
