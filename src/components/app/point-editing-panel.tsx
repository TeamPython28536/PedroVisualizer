import { RiDragMove2Line } from "@remixicon/react"
import { NumberField, SwitchRow } from "@/components/editor-controls"
import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"
import { roundCoord } from "@/lib/path-domain"

export function PointEditingPanel(viewModel: PedroVisualizerViewModel) {
  const {
    setSnapAngle,
    setSnapRange,
    setSnapToGrid,
    snapAngle,
    snapRange,
    snapToGrid,
  } = viewModel

  return (
    <>
      <section className="border bg-card p-3">
        <div className="mb-3 flex items-center gap-2">
          <RiDragMove2Line className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Point editing</h2>
        </div>
        <div className="grid gap-2">
          <SwitchRow
            checked={snapToGrid}
            description={`${snapRange} in, ${snapAngle} deg increments`}
            label="Snap to grid"
            onCheckedChange={setSnapToGrid}
          />
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Snap range in"
              min={0.1}
              step={0.5}
              value={snapRange}
              onChange={(value) =>
                setSnapRange(roundCoord(Math.max(0.1, value)))
              }
            />
            <NumberField
              label="Snap angle deg"
              min={1}
              step={1}
              value={snapAngle}
              onChange={(value) => setSnapAngle(Math.max(1, Math.round(value)))}
            />
          </div>
        </div>
      </section>
    </>
  )
}
