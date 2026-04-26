import { RiAddLine, RiDeleteBin6Line } from "@remixicon/react"
import { Tip } from "@/components/editor-controls"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"
import { DEFAULT_PATH_COLOR } from "@/lib/path-domain"

export function ChainsPanel(viewModel: PedroVisualizerViewModel) {
  const {
    activeChain,
    addChain,
    assignSelectedToChain,
    deleteChain,
    isolatedChainId,
    pathFile,
    selectedLine,
    setIsolatedChainId,
    updatePathFile,
  } = viewModel

  return (
    <>
      <section className="border bg-card p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Chains</h2>
          <div className="flex gap-1">
            {isolatedChainId ? (
              <Tip label="Stop isolating, show every chain">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsolatedChainId(null)}
                >
                  Show all
                </Button>
              </Tip>
            ) : null}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={addChain}
                    disabled={!pathFile}
                  >
                    <RiAddLine />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Add a new empty chain</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="themed-scrollbar max-h-64 space-y-2 overflow-auto pr-1">
          {pathFile?.pathChains?.map((chain) => {
            const isIsolated = isolatedChainId === chain.id
            const isActive = activeChain?.id === chain.id

            return (
              <div
                key={chain.id}
                className={`border bg-background p-2 ${
                  isIsolated ? "border-primary" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    className="size-7 shrink-0 border bg-transparent"
                    type="color"
                    value={chain.color ?? DEFAULT_PATH_COLOR}
                    onChange={(event) =>
                      updatePathFile((current) => ({
                        ...current,
                        pathChains: (current.pathChains ?? []).map(
                          (candidate) =>
                            candidate.id === chain.id
                              ? {
                                  ...candidate,
                                  color: event.target.value,
                                }
                              : candidate
                        ),
                      }))
                    }
                  />
                  <input
                    className="min-w-0 flex-1 border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
                    value={chain.name}
                    onChange={(event) =>
                      updatePathFile((current) => ({
                        ...current,
                        pathChains: (current.pathChains ?? []).map(
                          (candidate) =>
                            candidate.id === chain.id
                              ? { ...candidate, name: event.target.value }
                              : candidate
                        ),
                      }))
                    }
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-xs text-muted-foreground">
                    {chain.lineIds.length} segment
                    {chain.lineIds.length === 1 ? "" : "s"}
                  </p>
                  <div className="flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => deleteChain(chain.id)}
                        >
                          <RiDeleteBin6Line />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Delete this chain and its paths
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isIsolated ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            setIsolatedChainId((current) =>
                              current === chain.id ? null : chain.id
                            )
                          }
                        >
                          {isIsolated ? "Shown" : "Focus"}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isIsolated
                          ? "Show every chain again"
                          : "Show this chain clearly and fade the others"}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <Button
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => assignSelectedToChain(chain.id)}
                            disabled={!selectedLine || isActive}
                          >
                            {isActive ? "Current" : "Move here"}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {selectedLine
                          ? isActive
                            ? "The selected segment is already in this chain"
                            : "Move the selected segment into this chain"
                          : "Select a path segment before moving it into a chain"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}
