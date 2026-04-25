export type StatusBarViewProps = {
  x: number
  y: number
  zoom: number
  docWidth: number
  docHeight: number
}

export function StatusBarView({ x, y, zoom, docWidth, docHeight }: StatusBarViewProps) {
  const zoomPercent = Math.round(zoom * 100)

  return (
    <div
      role="status"
      aria-label="Status bar"
      className="bg-card text-foreground border-border flex items-center gap-4 border-t px-3 py-1 text-xs"
    >
      <span data-testid="coordinates">
        X: {x.toFixed(0)} Y: {y.toFixed(0)}
      </span>
      <span data-testid="zoom">{zoomPercent}%</span>
      <span data-testid="doc-size">
        {docWidth} × {docHeight}
      </span>
    </div>
  )
}
