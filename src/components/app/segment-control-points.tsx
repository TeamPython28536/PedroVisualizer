import { RiEdit2Line, RiSubtractLine } from "@remixicon/react"

import { NumberField, Tip } from "@/components/editor-controls"
import { Button } from "@/components/ui/button"
import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"
import { clamp, normalizePoint, roundCoord } from "@/lib/path-domain"

export function SegmentControlPoints(viewModel: PedroVisualizerViewModel) {
  const { selectedLine, selectedStartPoint, updateLine } = viewModel

  if (!selectedLine) {
    return null
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium">Control points</span>
        <div className="flex gap-1">
          <Tip label="Add a Bezier control point (max 2)">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => {
                const start = selectedStartPoint()
                const end = selectedLine.endPoint
                const point = start
                  ? normalizePoint({
                      x: (start.x + end.x) / 2,
                      y: (start.y + end.y) / 2,
                    })
                  : normalizePoint(end)
                updateLine(selectedLine.id, (line) => ({
                  ...line,
                  controlPoints: [...line.controlPoints, point].slice(0, 2),
                }))
              }}
              disabled={selectedLine.controlPoints.length >= 2}
            >
              <RiEdit2Line />
            </Button>
          </Tip>
          <Tip label="Remove the last control point">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() =>
                updateLine(selectedLine.id, (line) => ({
                  ...line,
                  controlPoints: line.controlPoints.slice(0, -1),
                }))
              }
              disabled={selectedLine.controlPoints.length === 0}
            >
              <RiSubtractLine />
            </Button>
          </Tip>
        </div>
      </div>
      {selectedLine.controlPoints.length === 0 ? (
        <p className="border bg-background p-2 text-xs text-muted-foreground">
          Straight segment. Add controls for quadratic or cubic curves.
        </p>
      ) : (
        selectedLine.controlPoints.map((controlPoint, index) => (
          <div key={index} className="grid grid-cols-2 gap-2">
            <NumberField
              label={`C${index + 1} X`}
              value={controlPoint.x}
              onChange={(value) =>
                updateLine(selectedLine.id, (line) => ({
                  ...line,
                  controlPoints: line.controlPoints.map((point, pointIndex) =>
                    pointIndex === index
                      ? {
                          ...point,
                          x: roundCoord(clamp(value)),
                        }
                      : point
                  ),
                }))
              }
            />
            <NumberField
              label={`C${index + 1} Y`}
              value={controlPoint.y}
              onChange={(value) =>
                updateLine(selectedLine.id, (line) => ({
                  ...line,
                  controlPoints: line.controlPoints.map((point, pointIndex) =>
                    pointIndex === index
                      ? {
                          ...point,
                          y: roundCoord(clamp(value)),
                        }
                      : point
                  ),
                }))
              }
            />
          </div>
        ))
      )}
    </div>
  )
}
