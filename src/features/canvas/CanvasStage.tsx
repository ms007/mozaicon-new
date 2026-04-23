import { useAtomValue } from 'jotai'
import { selectAtom } from 'jotai/utils'

import { ShapeRenderer } from '@/features/canvas/renderers/ShapeRenderer'
import { documentAtom, shapeAtomsAtom } from '@/store/atoms/document'

const CANVAS_SIZE = 512

// viewBox is a fresh array on every atomWithImmer update; compare by value
// so the stage doesn't re-render when other document fields change.
const viewBoxAtom = selectAtom(
  documentAtom,
  (doc) => doc.viewBox,
  (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3],
)

export function CanvasStage() {
  const viewBox = useAtomValue(viewBoxAtom)
  const shapeAtoms = useAtomValue(shapeAtomsAtom)

  return (
    <svg
      aria-label="Icon canvas"
      role="img"
      viewBox={viewBox.join(' ')}
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
