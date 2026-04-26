import { RiFocus3Line } from "@remixicon/react"
import { NumberField } from "@/components/editor-controls"
import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"
import { clamp, roundCoord } from "@/lib/path-domain"

export function StartPointPanel(viewModel: PedroVisualizerViewModel) {
  const { pathFile, updatePathFile } = viewModel

  return (
    <>
      <section className="border bg-card p-3">
        <div className="mb-3 flex items-center gap-2">
          <RiFocus3Line className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Start point</h2>
        </div>
        {pathFile ? (
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Start X"
              value={pathFile.startPoint.x}
              onChange={(value) =>
                updatePathFile((current) => ({
                  ...current,
                  startPoint: {
                    ...current.startPoint,
                    x: roundCoord(clamp(value)),
                  },
                }))
              }
            />
            <NumberField
              label="Start Y"
              value={pathFile.startPoint.y}
              onChange={(value) =>
                updatePathFile((current) => ({
                  ...current,
                  startPoint: {
                    ...current.startPoint,
                    y: roundCoord(clamp(value)),
                  },
                }))
              }
            />
            <NumberField
              label="Start deg"
              step={1}
              value={pathFile.startPoint.startDeg}
              onChange={(value) =>
                updatePathFile((current) => ({
                  ...current,
                  startPoint: {
                    ...current.startPoint,
                    startDeg: value,
                  },
                }))
              }
            />
            <NumberField
              label="End deg"
              step={1}
              value={pathFile.startPoint.endDeg}
              onChange={(value) =>
                updatePathFile((current) => ({
                  ...current,
                  startPoint: {
                    ...current.startPoint,
                    endDeg: value,
                  },
                  lines: current.lines.map((line, i) =>
                    i === 0
                      ? {
                          ...line,
                          endPoint: { ...line.endPoint, startDeg: value },
                        }
                      : line
                  ),
                }))
              }
            />
          </div>
        ) : null}
      </section>
    </>
  )
}
