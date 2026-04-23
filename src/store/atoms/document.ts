import { atom } from 'jotai'
import { splitAtom } from 'jotai/utils'
import { atomWithImmer } from 'jotai-immer'

import { DEFAULT_VIEWBOX, type Document, type Shape } from '@/types/shapes'

export const documentAtom = atomWithImmer<Document>({
  id: 'doc-1',
  name: 'Untitled',
  viewBox: [...DEFAULT_VIEWBOX] as Document['viewBox'],
  shapes: [],
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
