import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"
import { formatPath, getArrowHeadPoints, toSvgPoint } from "@/lib/path-domain"

export function PlacementPreviewLayer(viewModel: PedroVisualizerViewModel) {
  const { drawAnchor, hoverPoint, mode } = viewModel

  return (
    <>
      {mode === "place" && drawAnchor && hoverPoint ? (
        <g>
          {(() => {
            const point = toSvgPoint(hoverPoint)
            return (
              <circle
                cx={point.x}
                cy={point.y}
                fill="#0f172a"
                opacity="0.18"
                r="4.2"
              />
            )
          })()}
          <path
            d={formatPath([drawAnchor, hoverPoint])}
            fill="none"
            stroke="#0f172a"
            strokeDasharray="1.5 1.5"
            strokeLinecap="round"
            strokeOpacity="0.75"
            strokeWidth="0.65"
          />
          <polygon
            fill="#0f172a"
            opacity="0.75"
            points={getArrowHeadPoints([drawAnchor, hoverPoint])}
          />
        </g>
      ) : null}
    </>
  )
}
