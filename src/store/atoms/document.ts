import { atomWithImmer } from 'jotai-immer'

import { DEFAULT_VIEWBOX, type Document } from '@/types/shapes'

export const documentAtom = atomWithImmer<Document>({
  id: 'doc-1',
  name: 'Untitled',
  viewBox: [...DEFAULT_VIEWBOX] as Document['viewBox'],
  shapes: [],
})
