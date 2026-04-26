import { RiArrowDownSLine, RiRefreshLine } from "@remixicon/react"
import { Tip } from "@/components/editor-controls"
import { Button } from "@/components/ui/button"
import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"
import { cn } from "@/lib/utils"

export function SyncMenu(viewModel: PedroVisualizerViewModel) {
  const {
    handleSync,
    pathFile,
    setSyncMenuOpen,
    setSyncUrl,
    syncBusy,
    syncIndicator,
    syncMenuOpen,
    syncMenuRef,
    syncStatus,
    syncUrl,
  } = viewModel

  return (
    <>
      <div className="relative" ref={syncMenuRef}>
        <Tip label={`Sync to ${syncUrl}`}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSyncMenuOpen((v) => !v)}
            disabled={!pathFile}
          >
            <RiRefreshLine className={syncBusy ? "animate-spin" : undefined} />
            Sync
            <RiArrowDownSLine />
          </Button>
        </Tip>
        {syncMenuOpen ? (
          <div className="absolute top-full right-0 z-[100] mt-1 w-[280px] space-y-2 border bg-popover p-2 shadow-md">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-[10px] tracking-wide text-muted-foreground uppercase">
                Sync server
              </label>
              <div
                aria-live="polite"
                className={cn(
                  "inline-flex h-6 items-center border px-2 text-[11px] font-medium",
                  syncIndicator.className
                )}
              >
                {syncIndicator.label}
              </div>
            </div>
            <input
              type="text"
              className="h-8 w-full border bg-background px-2 text-sm outline-none focus:border-primary"
              value={syncUrl}
              onChange={(e) => setSyncUrl(e.target.value)}
              placeholder="http://localhost:7777"
            />
            <Button
              size="sm"
              className="w-full"
              onClick={async () => {
                setSyncMenuOpen(false)
                await handleSync()
              }}
              disabled={!pathFile || syncBusy}
            >
              <RiRefreshLine
                className={syncBusy ? "animate-spin" : undefined}
              />
              Sync now
            </Button>
            <p className="text-[11px] leading-snug text-muted-foreground">
              Run{" "}
              <code className="bg-muted px-1">bun run sync &lt;file&gt;</code>{" "}
              in your robot codebase, add{" "}
              <code className="bg-muted px-1">
                // VISUALIZER_PATH_BEGIN / // VISUALIZER_PATH_END
              </code>{" "}
              markers around your whole{" "}
              <code className="bg-muted px-1">Paths</code> companion/static
              block, then click Sync now.
            </p>
            {syncStatus ? (
              <p
                className={`text-xs ${syncStatus.kind === "ok" ? "text-emerald-500" : "text-destructive"}`}
              >
                {syncStatus.text}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  )
}
