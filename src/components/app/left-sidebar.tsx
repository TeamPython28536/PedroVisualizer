import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"
import { ChainsPanel } from "@/components/app/chains-panel"
import { FilePanel } from "@/components/app/file-panel"
import { PathListPanel } from "@/components/app/path-list-panel"

export function LeftSidebar(viewModel: PedroVisualizerViewModel) {
  return (
    <aside className="min-w-0 space-y-4">
      <FilePanel {...viewModel} />
      <ChainsPanel {...viewModel} />
      <PathListPanel {...viewModel} />
    </aside>
  )
}
