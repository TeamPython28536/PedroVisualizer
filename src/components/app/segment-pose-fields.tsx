import { NumberField } from "@/components/editor-controls"
import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"
import { clamp, roundCoord } from "@/lib/path-domain"

export function SegmentPoseFields(viewModel: PedroVisualizerViewModel) {
  const { selectedLine, updateLine, updatePathFile } = viewModel

  if (!selectedLine) {
    return null
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="End X"
          value={selectedLine.endPoint.x}
          onChange={(value) =>
            updateLine(selectedLine.id, (line) => ({
              ...line,
              endPoint: {
                ...line.endPoint,
                x: roundCoord(clamp(value)),
              },
            }))
          }
        />
        <NumberField
          label="End Y"
          value={selectedLine.endPoint.y}
          onChange={(value) =>
            updateLine(selectedLine.id, (line) => ({
              ...line,
              endPoint: {
                ...line.endPoint,
                y: roundCoord(clamp(value)),
              },
            }))
          }
        />
        <NumberField
          label="Start deg"
          step={1}
          value={selectedLine.endPoint.startDeg}
          onChange={(value) =>
            updatePathFile((current) => {
              const idx = current.lines.findIndex(
                (line) => line.id === selectedLine.id
              )
              if (idx === -1) return current
              const lines = current.lines.map((line, i) =>
                i === idx
                  ? {
                      ...line,
                      endPoint: {
                        ...line.endPoint,
                        startDeg: value,
                      },
                    }
                  : i === idx - 1
                    ? {
                        ...line,
                        endPoint: {
                          ...line.endPoint,
                          endDeg: value,
                        },
                      }
                    : line
              )
              if (idx === 0) {
                return {
                  ...current,
                  startPoint: {
                    ...current.startPoint,
                    endDeg: value,
                  },
                  lines,
                }
              }
              return { ...current, lines }
            })
          }
        />
        <NumberField
          label="End deg"
          step={1}
          value={selectedLine.endPoint.endDeg}
          onChange={(value) =>
            updatePathFile((current) => {
              const idx = current.lines.findIndex(
                (line) => line.id === selectedLine.id
              )
              if (idx === -1) return current
              const lines = current.lines.map((line, i) => {
                if (i === idx) {
                  return {
                    ...line,
                    endPoint: { ...line.endPoint, endDeg: value },
                  }
                }
                if (i === idx + 1) {
                  return {
                    ...line,
                    endPoint: { ...line.endPoint, startDeg: value },
                  }
                }
                return line
              })
              return { ...current, lines }
            })
          }
        />
      </div>
    </>
  )
}
