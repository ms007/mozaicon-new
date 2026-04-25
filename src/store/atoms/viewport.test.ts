import { createStore } from 'jotai'
import { describe, expect, it } from 'vitest'

import { type Viewport, viewportAtom } from './viewport'

describe('viewportAtom', () => {
  it('has sane initial values', () => {
    const store = createStore()
    const viewport = store.get(viewportAtom)

    expect(viewport).toEqual({
      x: 0,
      y: 0,
      zoom: 1,
      docSize: { w: 24, h: 24 },
    })
  })

  it('can be updated with new viewport state', () => {
    const store = createStore()
    const updated: Viewport = { x: 10, y: 20, zoom: 2, docSize: { w: 48, h: 48 } }

    store.set(viewportAtom, updated)

    expect(store.get(viewportAtom)).toEqual(updated)
  })
})
