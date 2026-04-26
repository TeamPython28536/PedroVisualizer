import { EmptyState } from "@/components/editor-controls"
import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"
import { FieldCanvas } from "@/components/app/field-canvas"
import { FieldControls } from "@/components/app/field-controls"

export function FieldWorkspace(viewModel: PedroVisualizerViewModel) {
  const { pathFile } = viewModel

  return (
    <section className="min-w-0">
      {pathFile ? (
        <div className="border bg-card p-3">
          <FieldControls {...viewModel} />
          <FieldCanvas {...viewModel} />
        </div>
      ) : (
        <EmptyState />
      )}
    </section>
  )
}
