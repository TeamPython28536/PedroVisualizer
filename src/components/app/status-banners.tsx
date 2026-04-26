import { RiRefreshLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"

export function StatusBanners(viewModel: PedroVisualizerViewModel) {
  const {
    applyPwaUpdate,
    dismissSessionRecovery,
    pwaNotice,
    pwaUpdateBusy,
    pwaUpdateError,
    restoreSession,
    sessionRecovery,
    sessionRecoveryTimestamp,
    setPwaNotice,
    setPwaUpdateError,
  } = viewModel

  return (
    <>
      {pwaNotice ? (
        <div className="border-b bg-muted/30">
          <div className="mx-auto flex max-w-[1680px] flex-wrap items-center gap-2 px-4 py-2 text-xs">
            <span className="font-medium text-foreground">
              {pwaNotice === "update-ready"
                ? "Update ready"
                : "Offline mode ready"}
            </span>
            <span className="text-muted-foreground">
              {pwaNotice === "update-ready"
                ? "A newer version was downloaded while online."
                : "Core assets are cached for weak or missing WiFi."}
            </span>
            {pwaNotice === "update-ready" ? (
              <>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => void applyPwaUpdate()}
                  disabled={pwaUpdateBusy}
                >
                  <RiRefreshLine
                    className={pwaUpdateBusy ? "animate-spin" : undefined}
                  />
                  {pwaUpdateBusy ? "Updating..." : "Refresh now"}
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    setPwaNotice(null)
                    setPwaUpdateError(null)
                  }}
                >
                  Later
                </Button>
              </>
            ) : null}
            {pwaUpdateError ? (
              <span className="text-destructive">{pwaUpdateError}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      {sessionRecovery ? (
        <div className="border-b bg-amber-500/10">
          <div className="mx-auto flex max-w-[1680px] flex-wrap items-center gap-2 px-4 py-2 text-xs">
            <span className="font-medium text-foreground">
              Restore last session?
            </span>
            <span className="text-muted-foreground">
              {sessionRecoveryTimestamp
                ? `Saved ${sessionRecoveryTimestamp}.`
                : "Unsaved edits were detected from your last visit."}
            </span>
            <Button
              size="xs"
              variant="outline"
              onClick={() => restoreSession(sessionRecovery)}
            >
              Restore
            </Button>
            <Button size="xs" variant="ghost" onClick={dismissSessionRecovery}>
              Discard
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}
