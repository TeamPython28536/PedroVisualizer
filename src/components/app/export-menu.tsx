import {
  RiArrowDownSLine,
  RiCodeSSlashLine,
  RiDownload2Line,
} from "@remixicon/react"
import { Tip } from "@/components/editor-controls"
import { Button } from "@/components/ui/button"
import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"

export function ExportMenu(viewModel: PedroVisualizerViewModel) {
  const {
    exportAsCode,
    exportMenuOpen,
    exportMenuRef,
    handleExport,
    pathFile,
    setExportMenuOpen,
  } = viewModel

  return (
    <>
      <div className="relative" ref={exportMenuRef}>
        <Tip label="Export the current path">
          <Button
            size="sm"
            onClick={() => setExportMenuOpen((v) => !v)}
            disabled={!pathFile}
          >
            <RiDownload2Line />
            Export
            <RiArrowDownSLine />
          </Button>
        </Tip>
        {exportMenuOpen ? (
          <div className="absolute top-full right-0 z-[100] mt-1 min-w-[180px] border bg-popover p-1 shadow-md">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => {
                setExportMenuOpen(false)
                handleExport()
              }}
            >
              <RiDownload2Line className="size-4" />
              .pp file
            </button>
            <div className="my-1 h-px bg-border" />
            <div className="px-2 pt-1 pb-1 text-[10px] tracking-wide text-muted-foreground uppercase">
              As code
            </div>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => {
                setExportMenuOpen(false)
                exportAsCode("java")
              }}
            >
              <RiCodeSSlashLine className="size-4" />
              Java
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => {
                setExportMenuOpen(false)
                exportAsCode("kotlin")
              }}
            >
              <RiCodeSSlashLine className="size-4" />
              Kotlin
            </button>
          </div>
        ) : null}
      </div>
    </>
  )
}
