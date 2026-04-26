import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"
import {
  DEFAULT_PATH_COLOR,
  formatPath,
  getArrowHeadPoints,
  getStartForLine,
  toSvgPoint,
} from "@/lib/path-domain"

export function PathSegmentsLayer(viewModel: PedroVisualizerViewModel) {
  const {
    handlePathPointerDown,
    isolatedChainId,
    pathFile,
    playbackLineId,
    selectedLineId,
    visualChain,
  } = viewModel

  if (!pathFile) {
    return null
  }

  return (
    <>
      {pathFile.lines.map((line, index) => {
        const start = getStartForLine(pathFile, index)
        const points = [start, ...line.controlPoints, line.endPoint]
        const chain = pathFile.pathChains?.find((candidate) =>
          candidate.lineIds.includes(line.id)
        )
        const color = line.color ?? chain?.color ?? DEFAULT_PATH_COLOR
        const selected = selectedLineId === line.id
        const playbackActive = playbackLineId === line.id
        const inActiveChain = visualChain?.lineIds.includes(line.id) ?? false
        const active = playbackLineId
          ? playbackActive
          : selected && (!isolatedChainId || inActiveChain)
        const focused = active || inActiveChain || selected
        const strokeColor = color
        const playbackView = Boolean(playbackLineId)
        const isolateView = Boolean(isolatedChainId && !playbackView)
        const opacity = active
          ? 1
          : playbackView
            ? inActiveChain
              ? 0.28
              : 0.14
            : isolateView
              ? inActiveChain
                ? 0.88
                : 0.14
              : inActiveChain
                ? 0.82
                : 0.58
        const strokeWidth = active ? 1.35 : inActiveChain ? 0.82 : 0.62
        return (
          <g key={line.id}>
            {focused && line.controlPoints.length > 0 ? (
              <polyline
                fill="none"
                points={[start, ...line.controlPoints, line.endPoint]
                  .map(toSvgPoint)
                  .map((point) => `${point.x},${point.y}`)
                  .join(" ")}
                stroke="#64748b"
                strokeDasharray="2 2"
                strokeOpacity="0.38"
                strokeWidth="0.25"
              />
            ) : null}
            <path
              d={formatPath(points)}
              fill="none"
              stroke="transparent"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="5"
              onPointerDown={(event) => handlePathPointerDown(event, line.id)}
            />
            <path
              d={formatPath(points)}
              fill="none"
              opacity={opacity}
              pointerEvents="none"
              stroke={strokeColor}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={strokeWidth}
            />
            <polygon
              fill={strokeColor}
              opacity={
                playbackView || isolateView
                  ? Math.max(opacity, focused ? 0.28 : 0.14)
                  : Math.max(opacity, focused ? 0.72 : 0.52)
              }
              pointerEvents="none"
              points={getArrowHeadPoints(points)}
            />
          </g>
        )
      })}
    </>
  )
}
