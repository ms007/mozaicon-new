// Pattern 2 wrapper (see docs/ui-primitives.md): the DS calls for monospace
// + tabular numerics on numeric-leaning fields (grid size, rotation degrees,
// …). Baking it in here means call-sites don't re-thread the same classes,
// and callers can still override by passing their own `className`.

import type { ComponentProps } from 'react'

import { Input as UIInput } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: ComponentProps<typeof UIInput>) {
  return <UIInput className={cn('font-mono tabular-nums', className)} {...props} />
}
