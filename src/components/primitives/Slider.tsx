// Pattern 2 wrapper (see docs/ui-primitives.md): vendor defaults to a 16px
// white thumb on a muted track; the DS calls for a 14px indigo thumb on
// `--track`. Tokens come from the global layer — only sizing and slot-targeted
// surfaces are restated here.

import type { ComponentProps } from 'react'

import { Slider as UISlider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

export function Slider({ className, ...props }: ComponentProps<typeof UISlider>) {
  return (
    <UISlider
      className={cn(
        '[&_[data-slot=slider-track]]:bg-track',
        '[&_[data-slot=slider-thumb]]:size-3.5',
        '[&_[data-slot=slider-thumb]]:bg-primary',
        className,
      )}
      {...props}
    />
  )
}
