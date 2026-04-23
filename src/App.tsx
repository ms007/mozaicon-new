import { DevSidebar } from '@/components/DevSidebar'
import { CanvasStage } from '@/features/canvas/CanvasStage'

export default function App() {
  return (
    <div className="bg-muted flex min-h-svh">
      <main className="flex flex-1 items-center justify-center p-8">
        <CanvasStage />
      </main>
      <DevSidebar />
    </div>
  )
}
