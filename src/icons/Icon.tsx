import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & {
  strokeWidth?: number
}

export function Icon({ children, className, strokeWidth = 1.5, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 14 14"
      width={14}
      height={14}
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
