import type { RectShape } from '@/types/shapes'

export function RectRenderer({ shape }: { shape: RectShape }) {
  return (
    <rect
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      fill={shape.fill ?? '#000'}
    />
  )
}
