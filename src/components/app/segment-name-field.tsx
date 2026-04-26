import { TextField } from "@/components/editor-controls"
import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"

export function SegmentNameField(viewModel: PedroVisualizerViewModel) {
  const { selectedLine, updateLine } = viewModel

  if (!selectedLine) {
    return null
  }

  return (
    <>
      <TextField
        label="Name"
        value={selectedLine.name}
        onChange={(value) =>
          updateLine(selectedLine.id, (line) => ({
            ...line,
            name: value,
          }))
        }
      />
    </>
  )
}
