import { atom } from 'jotai'

export type Viewport = {
  x: number
  y: number
  zoom: number
  docSize: { w: number; h: number }
}

const DEFAULT_VIEWPORT: Viewport = {
  x: 0,
  y: 0,
  zoom: 1,
  docSize: { w: 24, h: 24 },
}

export const viewportAtom = atom<Viewport>({ ...DEFAULT_VIEWPORT })
