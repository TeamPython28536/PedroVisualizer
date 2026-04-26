import { FIELD_SIZE, FIELD_TICKS } from "@/lib/path-domain"

export function FieldTicksLayer() {
  return (
    <>
      {FIELD_TICKS.map((tick) => (
        <g key={tick}>
          <line
            x1={tick}
            y1={FIELD_SIZE - 1.4}
            x2={tick}
            y2={FIELD_SIZE}
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="0.22"
          />
          <line
            x1="0"
            y1={FIELD_SIZE - tick}
            x2="1.4"
            y2={FIELD_SIZE - tick}
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="0.22"
          />
        </g>
      ))}
    </>
  )
}
