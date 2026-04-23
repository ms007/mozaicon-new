import { atom } from 'jotai'

import type { Document } from '@/types/shapes'

export type HistoryEntry = {
  label: string
  before: Document
  after: Document
}

export const undoStackAtom = atom<HistoryEntry[]>([])
export const redoStackAtom = atom<HistoryEntry[]>([])

export const canUndoAtom = atom((get) => get(undoStackAtom).length > 0)
export const canRedoAtom = atom((get) => get(redoStackAtom).length > 0)
