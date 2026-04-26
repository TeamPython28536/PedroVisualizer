import { TextField } from "@/components/editor-controls"
import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"

export function FilePanel(viewModel: PedroVisualizerViewModel) {
  const { error, fileName, pathFile, setFileName } = viewModel

  return (
    <>
      <section className="border bg-card p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">File</h2>
          <span className="text-xs text-muted-foreground">
            v{pathFile?.version ?? "-"}
          </span>
        </div>
        <div className="space-y-3">
          <TextField
            label="Export name"
            value={fileName}
            onChange={setFileName}
          />
          {error ? (
            <p className="border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </section>
    </>
  )
}
