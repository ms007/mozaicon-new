import { useSetAtom } from 'jotai'

import { Button } from '@/components/primitives/Button'
import { addShapeCommand } from '@/store/commands/addShape'

// TRANSIENT: delete once real layers/properties/export panels land.
export function DevSidebar() {
  const addShape = useSetAtom(addShapeCommand)

  return (
    <aside
      aria-label="Dev sidebar (transient)"
      className="bg-sidebar text-sidebar-foreground border-sidebar-border flex w-72 flex-col gap-3 border-l p-4"
    >
      <p className="text-muted-foreground text-xs tracking-wide uppercase">Dev Sidebar</p>
      <Button
        type="button"
        variant="default"
        size="sm"
        onClick={() => {
          addShape({ x: 4, y: 4, width: 16, height: 16, fill: '#000' })
        }}
      >
        Add Rect
      </Button>
    </aside>
  )
}
