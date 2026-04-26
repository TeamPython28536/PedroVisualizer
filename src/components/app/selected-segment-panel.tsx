import { RiDeleteBin6Line } from "@remixicon/react"
import { Tip } from "@/components/editor-controls"
import { Button } from "@/components/ui/button"
import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"
import { SegmentControlPoints } from "@/components/app/segment-control-points"
import { SegmentNameField } from "@/components/app/segment-name-field"
import { SegmentOptions } from "@/components/app/segment-options"
import { SegmentPoseFields } from "@/components/app/segment-pose-fields"
import { SegmentWaitFields } from "@/components/app/segment-wait-fields"

export function SelectedSegmentPanel(viewModel: PedroVisualizerViewModel) {
  const { deleteSelectedLine, pathFile, selectedLine } = viewModel

  return (
    <section className="border bg-card p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Selected segment</h2>
        <div className="flex gap-1">
          <Tip label="Delete the selected segment">
            <Button
              variant="destructive"
              size="icon-sm"
              onClick={deleteSelectedLine}
              disabled={!selectedLine}
            >
              <RiDeleteBin6Line />
            </Button>
          </Tip>
        </div>
      </div>

      {selectedLine && pathFile ? (
        <div className="space-y-4">
          <SegmentNameField {...viewModel} />
          <SegmentPoseFields {...viewModel} />
          <SegmentWaitFields {...viewModel} />
          <SegmentOptions {...viewModel} />
          <SegmentControlPoints {...viewModel} />
        </div>
      ) : (
        <p className="border bg-background p-3 text-sm text-muted-foreground">
          Select a path segment or add one to edit its coordinates.
        </p>
      )}
    </section>
  )
}
