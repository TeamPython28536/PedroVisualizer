import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"
import { PointEditingPanel } from "@/components/app/point-editing-panel"
import { RobotFootprintPanel } from "@/components/app/robot-footprint-panel"
import { SelectedSegmentPanel } from "@/components/app/selected-segment-panel"
import { StartPointPanel } from "@/components/app/start-point-panel"

export function RightInspector(viewModel: PedroVisualizerViewModel) {
  return (
    <aside className="min-w-0 space-y-4">
      <PointEditingPanel {...viewModel} />
      <SelectedSegmentPanel {...viewModel} />
      <StartPointPanel {...viewModel} />
      <RobotFootprintPanel {...viewModel} />
    </aside>
  )
}
