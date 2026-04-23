import { atom } from 'jotai'
import { splitAtom } from 'jotai/utils'
import { atomWithImmer } from 'jotai-immer'

import { DEFAULT_VIEWBOX, type Document, type Shape } from '@/types/shapes'

// TRANSIENT SEED: a single hardcoded rect so the data-driven renderer has
// something to show in this slice. Remove in the command-pipeline slice
// once shapes can be added at runtime (see issue tracking that work).
const SEED_SHAPES: Shape[] = [
  {
    id: 'seed-rect',
    name: 'Rect 1',
    visible: true,
    locked: false,
    type: 'rect',
    x: 4,
    y: 4,
    width: 16,
    height: 16,
    fill: '#000',
  },
]

export const documentAtom = atomWithImmer<Document>({
  id: 'doc-1',
  name: 'Untitled',
  viewBox: [...DEFAULT_VIEWBOX] as Document['viewBox'],
  shapes: SEED_SHAPES,
})

export const shapesAtom = atom(
  (get) => get(documentAtom).shapes,
  (_get, set, shapes: Shape[]) => {
    set(documentAtom, (draft) => {
      draft.shapes = shapes
    })
  },
)

export const shapeAtomsAtom = splitAtom(shapesAtom)

export const shapeByIdAtom = atom((get) => new Map(get(shapesAtom).map((s) => [s.id, s])))
