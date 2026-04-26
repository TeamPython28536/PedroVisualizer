import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"
import { FIELD_SIZE, GRID_STEP, toSvgPoint } from "@/lib/path-domain"

export function FieldBackgroundLayer(viewModel: PedroVisualizerViewModel) {
  const { pathFile, showShapes } = viewModel

  if (!pathFile) {
    return null
  }

  return (
    <>
      <defs>
        <pattern
          id="small-grid"
          width={GRID_STEP}
          height={GRID_STEP}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${GRID_STEP} 0 L 0 0 0 ${GRID_STEP}`}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.18"
            strokeWidth="0.25"
          />
        </pattern>
      </defs>

      <image
        href="/decode.webp"
        height={FIELD_SIZE}
        preserveAspectRatio="none"
        width={FIELD_SIZE}
        x="0"
        y="0"
      />
      <rect
        x="0"
        y="0"
        width={FIELD_SIZE}
        height={FIELD_SIZE}
        fill="url(#small-grid)"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="0.25"
      />
      <line
        x1={FIELD_SIZE / 2}
        y1="0"
        x2={FIELD_SIZE / 2}
        y2={FIELD_SIZE}
        stroke="#94a3b8"
        strokeDasharray="2 2"
        strokeOpacity="0.55"
        strokeWidth="0.25"
      />
      <line
        x1="0"
        y1={FIELD_SIZE / 2}
        x2={FIELD_SIZE}
        y2={FIELD_SIZE / 2}
        stroke="#94a3b8"
        strokeDasharray="2 2"
        strokeOpacity="0.55"
        strokeWidth="0.25"
      />

      {showShapes
        ? pathFile.shapes?.map((shape) => (
            <polygon
              key={shape.id}
              fill={shape.fillColor ?? shape.color ?? "#94a3b8"}
              fillOpacity="0.28"
              points={shape.vertices
                .map(toSvgPoint)
                .map((point) => `${point.x},${point.y}`)
                .join(" ")}
              stroke={shape.color ?? "#64748b"}
              strokeWidth="0.35"
            />
          ))
        : null}
    </>
  )
}
