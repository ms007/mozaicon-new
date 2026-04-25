import { atom } from 'jotai'

export type Viewport = {
  readonly x: number
  readonly y: number
  readonly zoom: number
  readonly docSize: { readonly w: number; readonly h: number }
}

const DEFAULT_VIEWPORT: Viewport = {
  x: 0,
  y: 0,
  zoom: 1,
  docSize: { w: 24, h: 24 },
}

export const viewportAtom = atom<Viewport>({
  ...DEFAULT_VIEWPORT,
  docSize: { ...DEFAULT_VIEWPORT.docSize },
})
