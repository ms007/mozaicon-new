// The global `prefers-reduced-motion` rule in `src/index.css` collapses the
// pill's transition duration to ~0ms without any per-component branch.

import type { ReactNode } from 'react'

import { ToggleGroup, ToggleGroupItem } from '@/components/primitives/ToggleGroup'
import { cn } from '@/lib/utils'

export type SegmentedOption = {
  value: string
  label: ReactNode
}

export type SegmentedProps = {
  options: SegmentedOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  'aria-label'?: string
}

export function Segmented({
  options,
  value,
  onChange,
  className,
  'aria-label': ariaLabel,
}: SegmentedProps) {
  const count = options.length
  const activeIndex = options.findIndex((option) => option.value === value)
  const pillLeft = ((Math.max(activeIndex, 0) / count) * 100).toString()
  const pillWidth = ((1 / count) * 100).toString()

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        // Radix fires "" when the user re-clicks the active segment. A
        // segmented control shouldn't allow deselection — swallow that case.
        if (next) onChange(next)
      }}
      aria-label={ariaLabel}
      className={cn(
        'bg-secondary text-muted-foreground relative grid w-full auto-cols-fr grid-flow-col gap-0 rounded-md p-0.5',
        className,
      )}
    >
      <span
        aria-hidden
        data-slot="segmented-pill"
        className={cn(
          'bg-background text-foreground pointer-events-none absolute inset-y-0.5 rounded-[5px] shadow-xs',
          'transition-[left,width] duration-200 ease-out',
          activeIndex < 0 && 'opacity-0',
        )}
        style={{ left: `${pillLeft}%`, width: `${pillWidth}%` }}
      />
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className={cn(
            'relative z-10 h-7 w-full min-w-0 bg-transparent px-3 text-sm',
            'data-[state=on]:text-foreground data-[state=on]:bg-transparent',
          )}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
