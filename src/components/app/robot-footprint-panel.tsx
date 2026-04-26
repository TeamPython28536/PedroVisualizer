import { RiDragMove2Line } from "@remixicon/react"
import { NumberField } from "@/components/editor-controls"
import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"
import { roundCoord } from "@/lib/path-domain"

export function RobotFootprintPanel(viewModel: PedroVisualizerViewModel) {
  const { pathFile, updateSetting } = viewModel

  return (
    <>
      <section className="border bg-card p-3">
        <div className="mb-3 flex items-center gap-2">
          <RiDragMove2Line className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Robot footprint</h2>
        </div>
        {pathFile ? (
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Width in"
              min={1}
              value={
                typeof pathFile.settings?.rWidth === "number"
                  ? pathFile.settings.rWidth
                  : 18
              }
              onChange={(value) =>
                updateSetting("rWidth", roundCoord(Math.max(1, value)))
              }
            />
            <NumberField
              label="Height in"
              min={1}
              value={
                typeof pathFile.settings?.rHeight === "number"
                  ? pathFile.settings.rHeight
                  : 18
              }
              onChange={(value) =>
                updateSetting("rHeight", roundCoord(Math.max(1, value)))
              }
            />
          </div>
        ) : null}
      </section>
    </>
  )
}
