import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"
import { DEFAULT_PATH_COLOR } from "@/lib/path-domain"

export function PathListPanel(viewModel: PedroVisualizerViewModel) {
  const { pathFile, playbackLineId, selectedLineId, setSelectedLineId, stats } =
    viewModel

  return (
    <>
      <section className="border bg-card p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Path list</h2>
          <span className="text-xs text-muted-foreground">
            {pathFile?.lines.length ?? 0} paths · {stats.distance.toFixed(0)}
            in
          </span>
        </div>
        <div className="themed-scrollbar max-h-[22rem] space-y-1 overflow-auto pr-1">
          {pathFile?.lines.map((line, index) => {
            const chain = pathFile.pathChains?.find((candidate) =>
              candidate.lineIds.includes(line.id)
            )
            const playingThisLine = playbackLineId === line.id
            const selectedThisLine = selectedLineId === line.id
            return (
              <button
                key={line.id}
                className={`flex w-full items-center gap-2 border p-2 text-left text-xs transition ${
                  playingThisLine
                    ? "border-primary bg-primary/10"
                    : selectedThisLine
                      ? "border-primary/40 bg-muted"
                      : "bg-background hover:bg-muted"
                }`}
                onClick={() => setSelectedLineId(line.id)}
              >
                <span
                  className="size-3 shrink-0 border"
                  style={{
                    backgroundColor:
                      line.color ?? chain?.color ?? DEFAULT_PATH_COLOR,
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {index + 1}. {line.name}
                  </span>
                  <span className="block truncate text-muted-foreground">
                    {chain?.name ?? "No chain"} · {line.endPoint.x},{" "}
                    {line.endPoint.y}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </>
  )
}
