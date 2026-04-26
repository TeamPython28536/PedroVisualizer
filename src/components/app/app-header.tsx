import {
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiFileUploadLine,
  RiMap2Line,
  RiRestartLine,
} from "@remixicon/react"
import { Tip } from "@/components/editor-controls"
import { Button } from "@/components/ui/button"
import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"
import { ExportMenu } from "@/components/app/export-menu"
import { SyncMenu } from "@/components/app/sync-menu"

export function AppHeader(viewModel: PedroVisualizerViewModel) {
  const { createNewPath, future, handleImport, past, redo, undo } = viewModel

  return (
    <header className="relative z-50 border-b bg-card/70 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 place-items-center border bg-primary text-primary-foreground">
            <RiMap2Line className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">
              Pedro Path Visualizer
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              Modern Pedro Path file editor and visualizer with code export
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            className="hidden"
            id="pp-import"
            type="file"
            accept=".pp,application/json"
            onChange={handleImport}
          />
          <Tip label="Undo (Ctrl+Z)">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={undo}
              disabled={past.length === 0}
            >
              <RiArrowGoBackLine />
            </Button>
          </Tip>
          <Tip label="Redo (Ctrl+Y / Ctrl+Shift+Z)">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={redo}
              disabled={future.length === 0}
            >
              <RiArrowGoForwardLine />
            </Button>
          </Tip>
          <Tip label="Start a fresh empty path">
            <Button variant="outline" size="sm" onClick={createNewPath}>
              <RiRestartLine />
              New path
            </Button>
          </Tip>
          <Tip label="Load a .pp file from disk">
            <Button asChild variant="outline" size="sm">
              <label htmlFor="pp-import">
                <RiFileUploadLine />
                Import .pp
              </label>
            </Button>
          </Tip>
          <SyncMenu {...viewModel} />
          <ExportMenu {...viewModel} />
        </div>
      </div>
    </header>
  )
}
