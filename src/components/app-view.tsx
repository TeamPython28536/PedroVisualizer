import { TooltipProvider } from "@/components/ui/tooltip"
import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"
import { AppHeader } from "@/components/app/app-header"
import { FieldWorkspace } from "@/components/app/field-workspace"
import { LeftSidebar } from "@/components/app/left-sidebar"
import { RightInspector } from "@/components/app/right-inspector"
import { StatusBanners } from "@/components/app/status-banners"

export function AppView(viewModel: PedroVisualizerViewModel) {
  return (
    <TooltipProvider>
      <div className="min-h-svh bg-background text-foreground">
        <AppHeader {...viewModel} />
        <StatusBanners {...viewModel} />
        <main className="mx-auto grid max-w-[1680px] gap-4 p-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <LeftSidebar {...viewModel} />
          <FieldWorkspace {...viewModel} />
          <RightInspector {...viewModel} />
        </main>
      </div>
    </TooltipProvider>
  )
}
