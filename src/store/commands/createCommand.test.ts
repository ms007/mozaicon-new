import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { documentAtom } from '@/store/atoms/document'
import { redoStackAtom, undoStackAtom } from '@/store/atoms/history'
import type { Document } from '@/types/shapes'

import { createCommand } from './createCommand'

const emptyDoc: Document = {
  id: 'doc-test',
  name: 'Test',
  viewBox: [0, 0, 24, 24],
  shapes: [],
}

function makeStore() {
  const store = createStore()
  store.set(documentAtom, emptyDoc)
  return store
}

describe('createCommand', () => {
  it('writes the next document and records a history entry on change', () => {
    const renameCommand = createCommand<string>('Rename', (doc, name) => ({ ...doc, name }))
    const store = makeStore()

    store.set(renameCommand, 'Next')

    expect(store.get(documentAtom).name).toBe('Next')
    const undo = store.get(undoStackAtom)
    expect(undo).toHaveLength(1)
    expect(undo[0]).toMatchObject({
      label: 'Rename',
      before: { name: 'Test' },
      after: { name: 'Next' },
    })
  })

  it('short-circuits when apply returns the same reference', () => {
    const noopCommand = createCommand<null>('Noop', (doc) => doc)
    const store = makeStore()
    const before = store.get(documentAtom)

    store.set(noopCommand, null)

    expect(store.get(documentAtom)).toBe(before)
    expect(store.get(undoStackAtom)).toHaveLength(0)
  })

  it('clears the redo stack on every dispatch', () => {
    const bumpCommand = createCommand<null>('Bump', (doc) => ({
      ...doc,
      name: `${doc.name}!`,
    }))
    const store = makeStore()
    store.set(redoStackAtom, [{ label: 'stale', before: emptyDoc, after: emptyDoc }])

    store.set(bumpCommand, null)

    expect(store.get(redoStackAtom)).toEqual([])
  })
})
