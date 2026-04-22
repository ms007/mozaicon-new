import { useAtomValue } from 'jotai'

import { documentAtom } from '@/store/atoms/document'

const CANVAS_SIZE = 512

export function CanvasStage() {
  const doc = useAtomValue(documentAtom)
  const viewBox = doc.viewBox.join(' ')

  return (
    <svg
      aria-label="Icon canvas"
      role="img"
      viewBox={viewBox}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      className="border-border bg-background block border"
    />
  )
}
