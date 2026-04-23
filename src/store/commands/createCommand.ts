import { atom } from 'jotai'

import { documentAtom } from '@/store/atoms/document'
import { redoStackAtom, undoStackAtom } from '@/store/atoms/history'
import type { Document } from '@/types/shapes'

// Referential equality short-circuits keep no-op commands out of history.
export function createCommand<Payload>(
  label: string,
  apply: (doc: Document, payload: Payload) => Document,
) {
  return atom(null, (get, set, payload: Payload) => {
    const before = get(documentAtom)
    const after = apply(before, payload)
    if (after === before) return

    set(documentAtom, after)
    set(undoStackAtom, (stack) => [...stack, { label, before, after }])
    set(redoStackAtom, [])
  })
}
