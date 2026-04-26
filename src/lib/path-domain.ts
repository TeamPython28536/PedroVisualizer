export const FIELD_SIZE = 141.5
export const GRID_STEP = FIELD_SIZE / 6
export const FIELD_TICKS = [0, 24, 48, 72, 96, 120, FIELD_SIZE]
export const DEFAULT_PATH_COLOR = "#2563EB"
export const PLAYBACK_SPEEDS = [0.5, 1, 2, 4] as const
export const CHAIN_COLORS = [
  "#E11D48",
  "#2563EB",
  "#F59E0B",
  "#16A34A",
  "#7C3AED",
  "#0891B2",
  "#F97316",
]
const SESSION_STORAGE_KEY = "visualizer.session.v1"
export const DEFAULT_SYNC_URL = "http://localhost:7777"

export type Point = {
  x: number
  y: number
}

export type HeadingMode = "linear" | "constant" | "tangent" | string

export type PathPoint = Point & {
  heading?: HeadingMode
  reverse?: boolean
  startDeg?: number
  endDeg?: number
  degrees?: number
  locked?: boolean
}

export type PathLine = {
  id: string
  name: string
  endPoint: PathPoint
  controlPoints: Point[]
  color?: string
  locked?: boolean
  waitBeforeMs?: number
  waitAfterMs?: number
  waitBeforeName?: string
  waitAfterName?: string
}

export type FieldShape = {
  id: string
  name?: string
  vertices: Point[]
  color?: string
  fillColor?: string
}

export type SequenceItem = {
  kind: "path" | string
  lineId?: string
  name?: string
}

export type PathChain = {
  id: string
  name: string
  color?: string
  lineIds: string[]
}

export type PedroPathFile = {
  startPoint: PathPoint
  lines: PathLine[]
  shapes?: FieldShape[]
  sequence?: SequenceItem[]
  pathChains?: PathChain[]
  settings?: Record<string, unknown>
  version?: string
  timestamp?: string
}

export type AxisLock = "x" | "y" | "xy"

export type PointDragTarget =
  | { kind: "start"; axis?: AxisLock }
  | { kind: "end"; lineId: string; axis?: AxisLock }
  | { kind: "control"; lineId: string; index: number; axis?: AxisLock }

export type RotatablePointTarget =
  | { kind: "start"; axis?: AxisLock }
  | { kind: "end"; lineId: string; axis?: AxisLock }

export type RotationDragTarget =
  | { kind: "rotate-start" }
  | { kind: "rotate-end"; lineId: string }

export type DragTarget = PointDragTarget | RotationDragTarget

export type TransformSelection = {
  mode: "move" | "rotate"
  target: PointDragTarget
}

export type ToolMode = "select" | "place"

export type SessionSnapshot = {
  version: 1
  savedAt: string
  pathFile: PedroPathFile
  fileName: string
  selectedLineId: string | null
  mode: ToolMode
  showShapes: boolean
  showRobot: boolean
  playbackSpeed: number
  isolatedChainId: string | null
  snapToGrid: boolean
  snapRange: number
  snapAngle: number
  syncUrl: string
}

export type RouteSample = {
  point: Point
  degrees: number
  distance: number
  lineId?: string
}

export const demoPath: PedroPathFile = {
  startPoint: {
    x: 21.8,
    y: 120.3,
    heading: "linear",
    startDeg: 90,
    endDeg: 180,
    locked: false,
  },
  lines: [
    {
      id: "line-demo-1",
      name: "Path 1",
      endPoint: {
        x: 51.8,
        y: 97,
        heading: "linear",
        startDeg: 144,
        endDeg: 140,
      },
      controlPoints: [],
      color: "#E11D48",
      locked: false,
      waitBeforeMs: 0,
      waitAfterMs: 0,
      waitBeforeName: "",
      waitAfterName: "",
    },
    {
      id: "line-demo-2",
      name: "Path 2",
      endPoint: {
        x: 51.8,
        y: 82,
        heading: "linear",
        reverse: false,
        startDeg: 140,
        endDeg: 180,
      },
      controlPoints: [],
      color: "#2563EB",
      waitBeforeMs: 0,
      waitAfterMs: 0,
      waitBeforeName: "",
      waitAfterName: "",
    },
    {
      id: "line-demo-3",
      name: "Path 3",
      endPoint: {
        x: 19,
        y: 82,
        heading: "linear",
        reverse: false,
        startDeg: 180,
        endDeg: 180,
      },
      controlPoints: [],
      color: "#2563EB",
      waitBeforeMs: 0,
      waitAfterMs: 0,
      waitBeforeName: "",
      waitAfterName: "",
    },
  ],
  shapes: [
    {
      id: "triangle-1",
      name: "Red Goal",
      vertices: [
        { x: 141.5, y: 70 },
        { x: 141.5, y: 141.5 },
        { x: 120, y: 141.5 },
        { x: 138, y: 119 },
        { x: 138, y: 70 },
      ],
      color: "#dc2626",
      fillColor: "#ff6b6b",
    },
    {
      id: "triangle-2",
      name: "Blue Goal",
      vertices: [
        { x: 6, y: 119 },
        { x: 25, y: 141.5 },
        { x: 0, y: 141.5 },
        { x: 0, y: 70 },
        { x: 6, y: 70 },
      ],
      color: "#2563eb",
      fillColor: "#60a5fa",
    },
  ],
  sequence: [
    { kind: "path", lineId: "line-demo-1" },
    { kind: "path", lineId: "line-demo-2" },
    { kind: "path", lineId: "line-demo-3" },
  ],
  pathChains: [
    {
      id: "chain-demo-preload",
      name: "Score Preload",
      color: "#E11D48",
      lineIds: ["line-demo-1"],
    },
    {
      id: "chain-demo-intake",
      name: "Intake 1",
      color: "#2563EB",
      lineIds: ["line-demo-2", "line-demo-3"],
    },
  ],
  settings: {
    xVelocity: 75,
    yVelocity: 65,
    aVelocity: Math.PI,
    rWidth: 18,
    rHeight: 18,
    maxVelocity: 40,
    maxAcceleration: 30,
    maxDeceleration: 30,
    fieldMap: "decode.webp",
    robotImage: "/robot.png",
    pathOpacity: 1,
  },
  version: "1.2.1",
  timestamp: new Date().toISOString(),
}

export function clamp(value: number, min = 0, max = FIELD_SIZE) {
  return Math.min(max, Math.max(min, value))
}

export function roundCoord(value: number) {
  return Math.round(value * 10) / 10
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function isPoint(value: unknown): value is Point {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<Point>
  return typeof candidate.x === "number" && typeof candidate.y === "number"
}

export function normalizePoint(point: Point): Point {
  return {
    x: roundCoord(clamp(point.x)),
    y: roundCoord(clamp(point.y)),
  }
}

export function isPedroPathFile(value: unknown): value is PedroPathFile {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<PedroPathFile>
  return isPoint(candidate.startPoint) && Array.isArray(candidate.lines)
}

export function normalizeFile(file: PedroPathFile): PedroPathFile {
  const lines = file.lines.map((line, index) => ({
    ...line,
    id: line.id || createId("line"),
    name: line.name || `Path ${index + 1}`,
    endPoint: {
      ...line.endPoint,
      ...normalizePoint(line.endPoint),
      heading: line.endPoint.heading ?? "linear",
    },
    controlPoints: Array.isArray(line.controlPoints)
      ? line.controlPoints.filter(isPoint).map(normalizePoint)
      : [],
    color:
      line.color ||
      CHAIN_COLORS[index % CHAIN_COLORS.length] ||
      DEFAULT_PATH_COLOR,
    waitBeforeMs: line.waitBeforeMs ?? 0,
    waitAfterMs: line.waitAfterMs ?? 0,
    waitBeforeName: line.waitBeforeName ?? "",
    waitAfterName: line.waitAfterName ?? "",
  }))

  return {
    ...file,
    startPoint: {
      ...file.startPoint,
      ...normalizePoint(file.startPoint),
      heading: file.startPoint.heading ?? "linear",
    },
    lines,
    shapes: Array.isArray(file.shapes) ? file.shapes : [],
    sequence:
      Array.isArray(file.sequence) && file.sequence.length > 0
        ? file.sequence
        : lines.map((line) => ({ kind: "path", lineId: line.id })),
    pathChains: Array.isArray(file.pathChains)
      ? file.pathChains
      : [
          {
            id: createId("chain"),
            name: "Main Chain",
            color: DEFAULT_PATH_COLOR,
            lineIds: lines.map((line) => line.id),
          },
        ],
    settings: file.settings ?? {},
    version: file.version ?? "1.2.1",
  }
}

export function isSessionSnapshot(value: unknown): value is SessionSnapshot {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<SessionSnapshot>
  return (
    candidate.version === 1 &&
    typeof candidate.savedAt === "string" &&
    isPedroPathFile(candidate.pathFile) &&
    typeof candidate.fileName === "string" &&
    (candidate.selectedLineId === null ||
      typeof candidate.selectedLineId === "string") &&
    (candidate.mode === "select" || candidate.mode === "place") &&
    typeof candidate.showShapes === "boolean" &&
    typeof candidate.showRobot === "boolean" &&
    typeof candidate.playbackSpeed === "number" &&
    (candidate.isolatedChainId === null ||
      typeof candidate.isolatedChainId === "string") &&
    typeof candidate.snapToGrid === "boolean" &&
    typeof candidate.snapRange === "number" &&
    typeof candidate.snapAngle === "number" &&
    typeof candidate.syncUrl === "string"
  )
}

export function readSessionSnapshot(): SessionSnapshot | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)
    if (!isSessionSnapshot(parsed)) {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function writeSessionSnapshot(snapshot: SessionSnapshot) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    /* no storage */
  }
}

export function clearSessionSnapshot() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    /* no storage */
  }
}

export function getStartForLine(
  file: PedroPathFile,
  lineIndex: number
): PathPoint {
  if (lineIndex <= 0) {
    return file.startPoint
  }

  return file.lines[lineIndex - 1]?.endPoint ?? file.startPoint
}

export function toSvgPoint(point: Point) {
  return {
    x: point.x,
    y: FIELD_SIZE - point.y,
  }
}

export function fromSvgPoint(point: Point) {
  return normalizePoint({
    x: point.x,
    y: FIELD_SIZE - point.y,
  })
}

export function formatPath(points: Point[]) {
  if (points.length < 2) {
    return ""
  }

  const [start, ...rest] = points.map(toSvgPoint)
  if (!start) {
    return ""
  }

  if (rest.length === 1) {
    const end = rest[0]
    return end ? `M ${start.x} ${start.y} L ${end.x} ${end.y}` : ""
  }

  if (rest.length === 2) {
    const control = rest[0]
    const end = rest[1]
    return control && end
      ? `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`
      : ""
  }

  const c1 = rest[0]
  const c2 = rest[1]
  const end = rest[rest.length - 1]
  return c1 && c2 && end
    ? `M ${start.x} ${start.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`
    : ""
}

export function getArrowHeadPoints(points: Point[], length = 3.8, width = 2.8) {
  if (points.length < 2) {
    return ""
  }

  const end = toSvgPoint(points[points.length - 1]!)
  const previous = toSvgPoint(points[points.length - 2]!)
  const dx = end.x - previous.x
  const dy = end.y - previous.y
  const magnitude = Math.hypot(dx, dy)

  if (magnitude === 0) {
    return ""
  }

  const ux = dx / magnitude
  const uy = dy / magnitude
  const baseX = end.x - ux * length
  const baseY = end.y - uy * length
  const px = -uy
  const py = ux

  return [
    `${end.x},${end.y}`,
    `${baseX + px * (width / 2)},${baseY + py * (width / 2)}`,
    `${baseX - px * (width / 2)},${baseY - py * (width / 2)}`,
  ].join(" ")
}

export function pointAtSegmentT(
  start: Point,
  line: PathLine,
  t: number
): Point {
  const [controlOne, controlTwo] = line.controlPoints
  const end = line.endPoint
  const inverse = 1 - t

  if (controlOne && controlTwo) {
    return {
      x:
        inverse ** 3 * start.x +
        3 * inverse ** 2 * t * controlOne.x +
        3 * inverse * t ** 2 * controlTwo.x +
        t ** 3 * end.x,
      y:
        inverse ** 3 * start.y +
        3 * inverse ** 2 * t * controlOne.y +
        3 * inverse * t ** 2 * controlTwo.y +
        t ** 3 * end.y,
    }
  }

  if (controlOne) {
    return {
      x:
        inverse ** 2 * start.x +
        2 * inverse * t * controlOne.x +
        t ** 2 * end.x,
      y:
        inverse ** 2 * start.y +
        2 * inverse * t * controlOne.y +
        t ** 2 * end.y,
    }
  }

  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  }
}

export function getPointHeading(from: Point, to: Point) {
  if (from.x === to.x && from.y === to.y) {
    return 0
  }

  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI
}

export function lerpAngleDeg(a: number, b: number, t: number) {
  const diff = ((((b - a) % 360) + 540) % 360) - 180
  return a + diff * t
}

export function buildRouteSamples(file: PedroPathFile) {
  const initialDegrees = getInitialPoseDegrees(file)
  const samples: RouteSample[] = [
    {
      point: file.startPoint,
      degrees: initialDegrees,
      distance: 0,
    },
  ]
  const lineEndDistances: Record<string, number> = {}
  let previous = file.startPoint
  let distance = 0

  for (let lineIndex = 0; lineIndex < file.lines.length; lineIndex += 1) {
    const line = file.lines[lineIndex]
    if (!line) {
      continue
    }

    const segmentStart = getStartForLine(file, lineIndex)
    previous = segmentStart

    const headingMode = line.endPoint.heading ?? "linear"
    const previousEndHeading =
      lineIndex === 0
        ? initialDegrees
        : (file.lines[lineIndex - 1]?.endPoint.endDeg ??
          file.lines[lineIndex - 1]?.endPoint.degrees ??
          initialDegrees)
    const startHeading = previousEndHeading
    const endHeading =
      line.endPoint.endDeg ?? line.endPoint.startDeg ?? startHeading

    const SUBSTEPS = 64
    for (let step = 1; step <= SUBSTEPS; step += 1) {
      const t = step / SUBSTEPS
      const point = pointAtSegmentT(segmentStart, line, t)
      distance += Math.hypot(point.x - previous.x, point.y - previous.y)
      let degrees: number
      if (headingMode === "tangent") {
        degrees = getPointHeading(previous, point)
      } else if (headingMode === "constant") {
        degrees = startHeading
      } else {
        degrees = lerpAngleDeg(startHeading, endHeading, t)
      }
      samples.push({
        point,
        degrees,
        distance,
        lineId: line.id,
      })
      previous = point
    }
    lineEndDistances[line.id] = distance
  }

  return { samples, totalDistance: distance, lineEndDistances }
}

export type TimelineEntry =
  | {
      kind: "move"
      lineId: string
      fromDist: number
      toDist: number
      startMs: number
      endMs: number
    }
  | {
      kind: "wait"
      lineId: string
      atDist: number
      startMs: number
      endMs: number
    }

export function buildPlaybackTimeline(
  file: PedroPathFile,
  lineEndDistances: Record<string, number>,
  speedScale: number
) {
  const entries: TimelineEntry[] = []
  let cursorMs = 0
  let prevDist = 0
  for (const line of file.lines) {
    const endDist = lineEndDistances[line.id] ?? prevDist
    const wb = Math.max(0, line.waitBeforeMs ?? 0)
    if (wb > 0) {
      entries.push({
        kind: "wait",
        lineId: line.id,
        atDist: prevDist,
        startMs: cursorMs,
        endMs: cursorMs + wb,
      })
      cursorMs += wb
    }
    const segDist = endDist - prevDist
    const moveMs = segDist > 0 ? (segDist / speedScale) * 1000 : 0
    entries.push({
      kind: "move",
      lineId: line.id,
      fromDist: prevDist,
      toDist: endDist,
      startMs: cursorMs,
      endMs: cursorMs + moveMs,
    })
    cursorMs += moveMs
    const wa = Math.max(0, line.waitAfterMs ?? 0)
    if (wa > 0) {
      entries.push({
        kind: "wait",
        lineId: line.id,
        atDist: endDist,
        startMs: cursorMs,
        endMs: cursorMs + wa,
      })
      cursorMs += wa
    }
    prevDist = endDist
  }
  return { entries, totalMs: cursorMs }
}

export function poseAtDistance(
  samples: RouteSample[],
  totalDistance: number,
  targetDistance: number,
  fallbackLineId?: string
) {
  if (samples.length === 0) return null
  if (totalDistance <= 0) return samples[0] ?? null
  const clamped = Math.max(0, Math.min(totalDistance, targetDistance))
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]
    const next = samples[index]
    if (!previous || !next) continue
    if (next.distance >= clamped) {
      const span = next.distance - previous.distance
      const t = span === 0 ? 0 : (clamped - previous.distance) / span
      const point = {
        x: previous.point.x + (next.point.x - previous.point.x) * t,
        y: previous.point.y + (next.point.y - previous.point.y) * t,
      }
      return {
        point,
        degrees: lerpAngleDeg(previous.degrees, next.degrees, t),
        distance: clamped,
        lineId: next.lineId ?? fallbackLineId,
      }
    }
  }
  return samples[samples.length - 1] ?? null
}

export function getPlaybackPose(
  samples: RouteSample[],
  totalDistance: number,
  entries: TimelineEntry[],
  totalMs: number,
  progress: number
) {
  if (samples.length === 0) return null
  if (entries.length === 0 || totalMs <= 0) {
    return poseAtDistance(
      samples,
      totalDistance,
      totalDistance * clamp(progress, 0, 1)
    )
  }
  const elapsed = totalMs * clamp(progress, 0, 1)
  for (const entry of entries) {
    if (elapsed <= entry.endMs) {
      if (entry.kind === "wait") {
        return poseAtDistance(
          samples,
          totalDistance,
          entry.atDist,
          entry.lineId
        )
      }
      const span = entry.endMs - entry.startMs
      const local = span === 0 ? 1 : (elapsed - entry.startMs) / span
      const dist = entry.fromDist + (entry.toDist - entry.fromDist) * local
      return poseAtDistance(samples, totalDistance, dist, entry.lineId)
    }
  }
  return poseAtDistance(
    samples,
    totalDistance,
    totalDistance,
    entries[entries.length - 1]?.lineId
  )
}

export function degreesToVector(degrees: number | undefined, length = 7) {
  const radians = ((degrees ?? 0) * Math.PI) / 180
  return {
    x: Math.cos(radians) * length,
    y: Math.sin(radians) * length,
  }
}

export function getStartPoseDegrees(point: PathPoint) {
  return point.startDeg ?? point.degrees ?? point.endDeg ?? 0
}

export function getInitialPoseDegrees(file: PedroPathFile) {
  const firstLine = file.lines[0]
  if (firstLine) {
    const fromFirstLine =
      firstLine.endPoint.startDeg ?? firstLine.endPoint.degrees
    if (typeof fromFirstLine === "number") {
      return fromFirstLine
    }
  }
  return getStartPoseDegrees(file.startPoint)
}

export function getEndPoseDegrees(point: PathPoint) {
  return point.endDeg ?? point.degrees ?? point.startDeg ?? 0
}

export function pointHeadingDegrees(from: Point, to: Point) {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI
}

export function isPointDragTarget(
  target: DragTarget
): target is PointDragTarget {
  return (
    target.kind === "start" ||
    target.kind === "end" ||
    target.kind === "control"
  )
}

export function isRotatablePointTarget(
  target: PointDragTarget
): target is RotatablePointTarget {
  return target.kind === "start" || target.kind === "end"
}

export function pointTargetKey(target: PointDragTarget) {
  if (target.kind === "start") {
    return "start"
  }

  if (target.kind === "end") {
    return `end:${target.lineId}`
  }

  return `control:${target.lineId}:${target.index}`
}
