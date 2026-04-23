import { useAtomValue } from 'jotai'
import { selectAtom } from 'jotai/utils'

import { ShapeRenderer } from '@/features/canvas/renderers/ShapeRenderer'
import { documentAtom, shapeAtomsAtom } from '@/store/atoms/document'

const CANVAS_SIZE = 512

// Pre-join so the stage only re-renders on actual viewBox changes; strings
// compare by value, sidestepping the fresh-array-per-immer-update trap.
const viewBoxStringAtom = selectAtom(documentAtom, (doc) => doc.viewBox.join(' '))

export function CanvasStage() {
  const viewBox = useAtomValue(viewBoxStringAtom)
  const shapeAtoms = useAtomValue(shapeAtomsAtom)

  return (
    <svg
      aria-label="Icon canvas"
      role="img"
      viewBox={viewBox}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      className="border-border bg-background block border"
    >
      {shapeAtoms.map((shapeAtom) => (
        <ShapeRenderer key={String(shapeAtom)} shapeAtom={shapeAtom} />
      ))}
    </svg>
  )
}
