import { NumberField } from "@/components/editor-controls"
import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"

export function SegmentWaitFields(viewModel: PedroVisualizerViewModel) {
  const { selectedLine, updateLine } = viewModel

  if (!selectedLine) {
    return null
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Wait before ms"
          min={0}
          step={100}
          value={selectedLine.waitBeforeMs}
          onChange={(value) =>
            updateLine(selectedLine.id, (line) => ({
              ...line,
              waitBeforeMs: Math.max(0, Math.round(value)),
            }))
          }
        />
        <NumberField
          label="Wait after ms"
          min={0}
          step={100}
          value={selectedLine.waitAfterMs}
          onChange={(value) =>
            updateLine(selectedLine.id, (line) => ({
              ...line,
              waitAfterMs: Math.max(0, Math.round(value)),
            }))
          }
        />
      </div>
    </>
  )
}
