import { useAtomValue } from 'jotai'

import { viewportAtom } from '@/store/atoms/viewport'

import { StatusBarView } from './StatusBarView'

export function StatusBar() {
  const viewport = useAtomValue(viewportAtom)

  return (
    <StatusBarView
      x={viewport.x}
      y={viewport.y}
      zoom={viewport.zoom}
      docWidth={viewport.docSize.w}
      docHeight={viewport.docSize.h}
    />
  )
}
