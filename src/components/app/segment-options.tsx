import { SwitchRow } from "@/components/editor-controls"
import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"

export function SegmentOptions(viewModel: PedroVisualizerViewModel) {
  const { selectedLine, updateLine } = viewModel

  if (!selectedLine) {
    return null
  }

  return (
    <>
      <div className="grid gap-1 text-xs text-muted-foreground">
        Heading mode
        <select
          className="h-8 w-full min-w-0 appearance-none border bg-background px-2 text-sm text-foreground outline-none focus:border-primary"
          value={selectedLine.endPoint.heading ?? "linear"}
          onChange={(event) =>
            updateLine(selectedLine.id, (line) => ({
              ...line,
              endPoint: {
                ...line.endPoint,
                heading: event.target.value,
              },
            }))
          }
        >
          <option value="linear">linear</option>
          <option value="constant">constant</option>
          <option value="tangent">tangent</option>
        </select>
      </div>

      <SwitchRow
        checked={Boolean(selectedLine.endPoint.reverse)}
        description="Sets endPoint.reverse"
        label="Reverse"
        onCheckedChange={(checked) =>
          updateLine(selectedLine.id, (line) => ({
            ...line,
            endPoint: {
              ...line.endPoint,
              reverse: checked,
            },
          }))
        }
      />
    </>
  )
}
