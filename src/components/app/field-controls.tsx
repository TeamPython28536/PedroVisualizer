import {
  RiAddLine,
  RiDragMove2Line,
  RiPauseLine,
  RiPlayLine,
  RiRestartLine,
} from "@remixicon/react"
import { Tip } from "@/components/editor-controls"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"
import { PLAYBACK_SPEEDS } from "@/lib/path-domain"
import { cn } from "@/lib/utils"

export function FieldControls(viewModel: PedroVisualizerViewModel) {
  const {
    dragTarget,
    isPlaying,
    mode,
    pathFile,
    playbackProgress,
    playbackSpeed,
    routeSamples,
    setIsPlaying,
    setMode,
    setPlaybackProgress,
    setPlaybackSpeed,
    setShowRobot,
    setShowShapes,
    showRobot,
    showShapes,
  } = viewModel

  return (
    <>
      <div className="mb-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Field</h2>
            <p className="text-xs text-muted-foreground">
              Select a point to edit it. Add point places the next path point on
              the field.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RiDragMove2Line className="size-4" />
            {dragTarget
              ? "Dragging point"
              : mode === "place"
                ? "Click field to place next point"
                : "Click a line or point to select it"}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border bg-background p-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <Tip
              label={
                mode === "place"
                  ? "Click the field to place the next point. Click again to exit."
                  : "Switch to placement mode and add points by clicking the field"
              }
            >
              <Button
                variant={mode === "place" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setMode((current) =>
                    current === "place" ? "select" : "place"
                  )
                }
                disabled={!pathFile}
              >
                <RiAddLine />
                {mode === "place" ? "Placing point" : "Add point"}
              </Button>
            </Tip>
            <Tip
              label={isPlaying ? "Pause playback" : "Play the path animation"}
            >
              <Button
                variant={isPlaying ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (playbackProgress >= 1) {
                    setPlaybackProgress(0)
                  }
                  setIsPlaying((current) => !current)
                  setMode("select")
                }}
                disabled={routeSamples.totalDistance <= 0}
              >
                {isPlaying ? <RiPauseLine /> : <RiPlayLine />}
                {isPlaying ? "Pause" : "Play"}
              </Button>
            </Tip>
            <Tip label="Reset playback to the start">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPlaybackProgress(0)
                  setIsPlaying(false)
                }}
                disabled={playbackProgress === 0 && !isPlaying}
              >
                <RiRestartLine />
                Reset
              </Button>
            </Tip>
          </div>
          <div className="flex shrink-0 items-center justify-center gap-2">
            <Tip
              label={
                showRobot
                  ? "Hide the robot footprint"
                  : "Show the robot footprint"
              }
            >
              <button
                className={`inline-flex h-7 shrink-0 items-center justify-center border px-2.5 text-xs font-medium transition-colors ${
                  showRobot
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted hover:text-foreground"
                }`}
                type="button"
                onClick={() => setShowRobot((value) => !value)}
              >
                Robot
              </button>
            </Tip>
            <Tip
              label={
                showShapes
                  ? "Hide field goals & shapes"
                  : "Show field goals & shapes"
              }
            >
              <button
                className={`inline-flex h-7 shrink-0 items-center justify-center border px-2.5 text-xs font-medium transition-colors ${
                  showShapes
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted hover:text-foreground"
                }`}
                type="button"
                onClick={() => setShowShapes((value) => !value)}
              >
                Goals
              </button>
            </Tip>
          </div>
          <div className="flex flex-1 shrink-0 items-center justify-end gap-2">
            <div className="inline-flex h-7 shrink-0 items-center border bg-muted/40 p-0.5">
              {PLAYBACK_SPEEDS.map((speed) => (
                <Tip key={speed} label={`Playback speed ${speed}x`}>
                  <button
                    aria-label={`Playback speed ${speed}x`}
                    aria-pressed={playbackSpeed === speed}
                    className={cn(
                      "inline-flex h-6 min-w-8 items-center justify-center border px-2 text-xs font-medium transition-colors",
                      playbackSpeed === speed
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-transparent bg-background text-foreground hover:bg-muted"
                    )}
                    type="button"
                    onClick={() => setPlaybackSpeed(speed)}
                  >
                    {speed}x
                  </button>
                </Tip>
              ))}
            </div>
            <span className="w-8 text-right text-xs text-muted-foreground">
              {Math.round(playbackProgress * 100)}%
            </span>
            <Slider
              aria-label="Playback progress"
              className="w-24 sm:w-32"
              max={100}
              min={0}
              step={1}
              value={[Math.round(playbackProgress * 100)]}
              onValueChange={([value]) => {
                setIsPlaying(false)
                setPlaybackProgress((value ?? 0) / 100)
              }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
