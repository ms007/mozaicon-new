import { type PrimitiveAtom, useAtomValue } from 'jotai'

import { assertNever } from '@/lib/assertNever'
import type { Shape } from '@/types/shapes'

import { RectRenderer } from './RectRenderer'

export function ShapeRenderer({ shapeAtom }: { shapeAtom: PrimitiveAtom<Shape> }) {
  const shape = useAtomValue(shapeAtom)

  /* eslint-disable @typescript-eslint/no-unnecessary-condition -- exhaustive guard for future Shape variants */
  switch (shape.type) {
    case 'rect':
      return <RectRenderer shape={shape} />
    default:
      return assertNever(shape.type)
  }
  /* eslint-enable @typescript-eslint/no-unnecessary-condition */
}
