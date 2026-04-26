import { FIELD_SIZE } from "@/lib/path-domain"
import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"
import { FieldBackgroundLayer } from "@/components/app/field-background-layer"
import { FieldTicksLayer } from "@/components/app/field-ticks-layer"
import { PathSegmentsLayer } from "@/components/app/path-segments-layer"
import { PlacementPreviewLayer } from "@/components/app/placement-preview-layer"
import { PointHandlesLayer } from "@/components/app/point-handles-layer"
import { RobotPreviewLayer } from "@/components/app/robot-preview-layer"

export function FieldCanvas(viewModel: PedroVisualizerViewModel) {
  const {
    handleDiagramContextMenu,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    mode,
    pathFile,
    renderAxisHandles,
    renderRotationHandle,
    setHoverPoint,
    svgRef,
    transformSelection,
  } = viewModel

  if (!pathFile) {
    return null
  }

  return (
    <div
      className={`overflow-hidden border bg-card ${
        mode === "place" ? "border-primary ring-2 ring-primary/30" : ""
      }`}
    >
      <svg
        ref={svgRef}
        className={`mx-auto block aspect-square w-full max-w-[min(72vh,900px)] touch-none ${
          mode === "place" ? "cursor-crosshair" : ""
        }`}
        role="img"
        viewBox={`0 0 ${FIELD_SIZE} ${FIELD_SIZE}`}
        onContextMenu={handleDiagramContextMenu}
        onPointerDown={(event) => handlePointerDown(event)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => setHoverPoint(null)}
      >
        <FieldBackgroundLayer {...viewModel} />
        <PathSegmentsLayer {...viewModel} />
        <PlacementPreviewLayer {...viewModel} />
        <RobotPreviewLayer {...viewModel} />
        <PointHandlesLayer {...viewModel} />
        {transformSelection ? renderAxisHandles(transformSelection) : null}
        {transformSelection ? renderRotationHandle(transformSelection) : null}
        <FieldTicksLayer />
      </svg>
      <div className="flex items-center justify-between border-t bg-background px-2 py-1 text-xs text-muted-foreground">
        <span>Field</span>
        <span>
          {FIELD_SIZE}" x {FIELD_SIZE}"
        </span>
      </div>
    </div>
  )
}
