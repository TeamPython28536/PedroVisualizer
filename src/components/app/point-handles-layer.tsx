import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"
import {
  DEFAULT_PATH_COLOR,
  degreesToVector,
  getEndPoseDegrees,
  getStartPoseDegrees,
  toSvgPoint,
} from "@/lib/path-domain"

export function PointHandlesLayer(viewModel: PedroVisualizerViewModel) {
  const {
    activeChain,
    handlePointerDown,
    pathFile,
    revealPointTools,
    selectedLineId,
  } = viewModel

  if (!pathFile) {
    return null
  }

  return (
    <>
      <g>
        {(() => {
          const start = toSvgPoint(pathFile.startPoint)
          const vector = degreesToVector(
            getStartPoseDegrees(pathFile.startPoint)
          )
          return (
            <g>
              <circle
                cx={start.x}
                cy={start.y}
                fill="transparent"
                r="5"
                onContextMenu={(event) =>
                  revealPointTools(event, { kind: "start" })
                }
                onPointerDown={(event) => {
                  event.stopPropagation()
                  handlePointerDown(event, { kind: "start" })
                }}
              />
              <line
                x1={start.x}
                y1={start.y}
                x2={start.x + vector.x}
                y2={start.y - vector.y}
                stroke="#111827"
                strokeWidth="0.35"
              />
              <circle
                cx={start.x}
                cy={start.y}
                fill="#111827"
                r="1.35"
                stroke="#ffffff"
                strokeWidth="0.45"
                onContextMenu={(event) =>
                  revealPointTools(event, { kind: "start" })
                }
                onPointerDown={(event) => {
                  event.stopPropagation()
                  handlePointerDown(event, { kind: "start" })
                }}
              />
            </g>
          )
        })()}

        {pathFile.lines.map((line) => {
          const end = toSvgPoint(line.endPoint)
          const active = selectedLineId === line.id
          const inActiveChain = activeChain?.lineIds.includes(line.id) ?? false
          const focused = active || inActiveChain
          const vector = degreesToVector(getEndPoseDegrees(line.endPoint))
          return (
            <g key={`points-${line.id}`}>
              {active ? (
                <line
                  x1={end.x}
                  y1={end.y}
                  x2={end.x + vector.x}
                  y2={end.y - vector.y}
                  stroke={line.color ?? DEFAULT_PATH_COLOR}
                  strokeOpacity="0.85"
                  strokeWidth="0.35"
                />
              ) : null}
              {focused
                ? line.controlPoints.map((controlPoint, index) => {
                    const point = toSvgPoint(controlPoint)
                    return (
                      <g key={`${line.id}-control-${index}`}>
                        <rect
                          fill="transparent"
                          height="8"
                          width="8"
                          x={point.x - 4}
                          y={point.y - 4}
                          onContextMenu={(event) =>
                            revealPointTools(event, {
                              kind: "control",
                              lineId: line.id,
                              index,
                            })
                          }
                          onPointerDown={(event) => {
                            event.stopPropagation()
                            handlePointerDown(event, {
                              kind: "control",
                              lineId: line.id,
                              index,
                            })
                          }}
                        />
                        <rect
                          fill="#f8fafc"
                          height="3.2"
                          stroke="#334155"
                          strokeWidth="0.45"
                          width="3.2"
                          x={point.x - 1.6}
                          y={point.y - 1.6}
                          onContextMenu={(event) =>
                            revealPointTools(event, {
                              kind: "control",
                              lineId: line.id,
                              index,
                            })
                          }
                          onPointerDown={(event) => {
                            event.stopPropagation()
                            handlePointerDown(event, {
                              kind: "control",
                              lineId: line.id,
                              index,
                            })
                          }}
                        />
                      </g>
                    )
                  })
                : null}
              <circle
                cx={end.x}
                cy={end.y}
                fill="transparent"
                r="5"
                onContextMenu={(event) =>
                  revealPointTools(event, {
                    kind: "end",
                    lineId: line.id,
                  })
                }
                onPointerDown={(event) => {
                  event.stopPropagation()
                  handlePointerDown(event, {
                    kind: "end",
                    lineId: line.id,
                  })
                }}
              />
              <circle
                cx={end.x}
                cy={end.y}
                fill={active ? "#ffffff" : (line.color ?? DEFAULT_PATH_COLOR)}
                opacity={active ? 1 : focused ? 0.75 : 0.3}
                r={active ? 2.1 : focused ? 1.35 : 0.9}
                stroke={line.color ?? DEFAULT_PATH_COLOR}
                strokeWidth={active ? 0.85 : 0.35}
                onContextMenu={(event) =>
                  revealPointTools(event, {
                    kind: "end",
                    lineId: line.id,
                  })
                }
                onPointerDown={(event) => {
                  event.stopPropagation()
                  handlePointerDown(event, {
                    kind: "end",
                    lineId: line.id,
                  })
                }}
              />
            </g>
          )
        })}
      </g>
    </>
  )
}
