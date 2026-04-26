import type { PedroVisualizerViewModel } from "@/hooks/use-pedro-visualizer"
import { toSvgPoint } from "@/lib/path-domain"

export function RobotPreviewLayer(viewModel: PedroVisualizerViewModel) {
  const { pathFile, robotPose, showRobot } = viewModel

  if (!pathFile) {
    return null
  }

  return (
    <>
      {showRobot && robotPose
        ? (() => {
            const center = toSvgPoint(robotPose.point)
            const width =
              typeof pathFile.settings?.rWidth === "number"
                ? pathFile.settings.rWidth
                : 18
            const height =
              typeof pathFile.settings?.rHeight === "number"
                ? pathFile.settings.rHeight
                : 18
            const rotation = `rotate(${-robotPose.degrees} ${center.x} ${center.y})`

            return (
              <g transform={rotation}>
                <rect
                  fill="#ffffff"
                  fillOpacity="0.22"
                  height={height}
                  stroke="#0f172a"
                  strokeOpacity="0.55"
                  strokeWidth="0.28"
                  width={width}
                  x={center.x - width / 2}
                  y={center.y - height / 2}
                />
                <image
                  href="/robot.png"
                  height={height}
                  preserveAspectRatio="xMidYMid meet"
                  width={width}
                  x={center.x - width / 2}
                  y={center.y - height / 2}
                />
              </g>
            )
          })()
        : null}
    </>
  )
}
