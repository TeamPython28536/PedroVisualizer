import { useEffect, useId, useMemo, useRef, useState } from "react"
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiCodeSSlashLine,
  RiDeleteBin6Line,
  RiDownload2Line,
  RiDragMove2Line,
  RiEdit2Line,
  RiFileUploadLine,
  RiFocus3Line,
  RiMap2Line,
  RiPauseLine,
  RiPlayLine,
  RiRestartLine,
  RiRouteLine,
  RiSubtractLine,
} from "@remixicon/react"

import type { ReactElement, ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

function Tip({ label, children }: { label: ReactNode; children: ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

const FIELD_SIZE = 141.5
const GRID_STEP = FIELD_SIZE / 6
const FIELD_TICKS = [0, 24, 48, 72, 96, 120, FIELD_SIZE]
const DEFAULT_PATH_COLOR = "#2563EB"
const PLAYBACK_SPEEDS = [0.5, 1, 2, 4] as const
const CHAIN_COLORS = [
  "#E11D48",
  "#2563EB",
  "#F59E0B",
  "#16A34A",
  "#7C3AED",
  "#0891B2",
  "#F97316",
]

type Point = {
  x: number
  y: number
}

type HeadingMode = "linear" | "constant" | "tangent" | string

type PathPoint = Point & {
  heading?: HeadingMode
  reverse?: boolean
  startDeg?: number
  endDeg?: number
  degrees?: number
  locked?: boolean
}

type PathLine = {
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

type FieldShape = {
  id: string
  name?: string
  vertices: Point[]
  color?: string
  fillColor?: string
}

type SequenceItem = {
  kind: "path" | string
  lineId?: string
  name?: string
}

type PathChain = {
  id: string
  name: string
  color?: string
  lineIds: string[]
}

type PedroPathFile = {
  startPoint: PathPoint
  lines: PathLine[]
  shapes?: FieldShape[]
  sequence?: SequenceItem[]
  pathChains?: PathChain[]
  settings?: Record<string, unknown>
  version?: string
  timestamp?: string
}

type AxisLock = "x" | "y" | "xy"

type PointDragTarget =
  | { kind: "start"; axis?: AxisLock }
  | { kind: "end"; lineId: string; axis?: AxisLock }
  | { kind: "control"; lineId: string; index: number; axis?: AxisLock }

type RotatablePointTarget =
  | { kind: "start"; axis?: AxisLock }
  | { kind: "end"; lineId: string; axis?: AxisLock }

type RotationDragTarget =
  | { kind: "rotate-start" }
  | { kind: "rotate-end"; lineId: string }

type DragTarget = PointDragTarget | RotationDragTarget

type TransformSelection = {
  mode: "move" | "rotate"
  target: PointDragTarget
}

type ToolMode = "select" | "place"

type RouteSample = {
  point: Point
  degrees: number
  distance: number
  lineId?: string
}

const demoPath: PedroPathFile = {
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

function clamp(value: number, min = 0, max = FIELD_SIZE) {
  return Math.min(max, Math.max(min, value))
}

function roundCoord(value: number) {
  return Math.round(value * 10) / 10
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function isPoint(value: unknown): value is Point {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<Point>
  return typeof candidate.x === "number" && typeof candidate.y === "number"
}

function normalizePoint(point: Point): Point {
  return {
    x: roundCoord(clamp(point.x)),
    y: roundCoord(clamp(point.y)),
  }
}

function isPedroPathFile(value: unknown): value is PedroPathFile {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<PedroPathFile>
  return isPoint(candidate.startPoint) && Array.isArray(candidate.lines)
}

function normalizeFile(file: PedroPathFile): PedroPathFile {
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
    pathChains:
      Array.isArray(file.pathChains) && file.pathChains.length > 0
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

function getStartForLine(file: PedroPathFile, lineIndex: number): PathPoint {
  if (lineIndex <= 0) {
    return file.startPoint
  }

  return file.lines[lineIndex - 1]?.endPoint ?? file.startPoint
}

function toSvgPoint(point: Point) {
  return {
    x: point.x,
    y: FIELD_SIZE - point.y,
  }
}

function fromSvgPoint(point: Point) {
  return normalizePoint({
    x: point.x,
    y: FIELD_SIZE - point.y,
  })
}

function formatPath(points: Point[]) {
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

function getArrowHeadPoints(points: Point[], length = 3.8, width = 2.8) {
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

function pointAtSegmentT(start: Point, line: PathLine, t: number): Point {
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

function getPointHeading(from: Point, to: Point) {
  if (from.x === to.x && from.y === to.y) {
    return 0
  }

  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI
}

function lerpAngleDeg(a: number, b: number, t: number) {
  let diff = ((((b - a) % 360) + 540) % 360) - 180
  return a + diff * t
}

function buildRouteSamples(file: PedroPathFile) {
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

type TimelineEntry =
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

function buildPlaybackTimeline(
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

function poseAtDistance(
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

function getPlaybackPose(
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

function degreesToVector(degrees: number | undefined, length = 7) {
  const radians = ((degrees ?? 0) * Math.PI) / 180
  return {
    x: Math.cos(radians) * length,
    y: Math.sin(radians) * length,
  }
}

function getStartPoseDegrees(point: PathPoint) {
  return point.startDeg ?? point.degrees ?? point.endDeg ?? 0
}

function getInitialPoseDegrees(file: PedroPathFile) {
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

function getEndPoseDegrees(point: PathPoint) {
  return point.endDeg ?? point.degrees ?? point.startDeg ?? 0
}

function pointHeadingDegrees(from: Point, to: Point) {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI
}

function isPointDragTarget(target: DragTarget): target is PointDragTarget {
  return (
    target.kind === "start" ||
    target.kind === "end" ||
    target.kind === "control"
  )
}

function isRotatablePointTarget(
  target: PointDragTarget
): target is RotatablePointTarget {
  return target.kind === "start" || target.kind === "end"
}

function pointTargetKey(target: PointDragTarget) {
  if (target.kind === "start") {
    return "start"
  }

  if (target.kind === "end") {
    return `end:${target.lineId}`
  }

  return `control:${target.lineId}:${target.index}`
}

function toIdentifier(input: string, pascal = true): string {
  const parts = input
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((p) => p.replace(/[^A-Za-z0-9]/g, ""))
  if (parts.length === 0) return ""
  const cased = parts.map((p, i) => {
    const head = p.charAt(0)
    const tail = p.slice(1)
    if (i === 0 && !pascal) {
      return head.toLowerCase() + tail
    }
    return head.toUpperCase() + tail
  })
  let id = cased.join("")
  if (/^[0-9]/.test(id)) id = "_" + id
  return id
}

function fmtNum(n: number): string {
  return n.toFixed(3)
}

function fmtDeg(n: number): string {
  return Number.isInteger(n) ? `${n}.0` : `${n}`
}

type CodeLang = "java" | "kotlin"

function buildPathCode(file: PedroPathFile, lang: CodeLang): string {
  const chains = (file.pathChains ?? []).filter((c) => c.lineIds.length > 0)
  const usedNames = new Set<string>()
  const chainIdent: Record<string, string> = {}
  for (const chain of chains) {
    let base = toIdentifier(chain.name || "Chain", true) || "Chain"
    let name = base
    let i = 2
    while (usedNames.has(name)) {
      name = `${base}${i++}`
    }
    usedNames.add(name)
    chainIdent[chain.id] = name
  }

  const lineIndex = new Map<string, number>()
  file.lines.forEach((line, idx) => lineIndex.set(line.id, idx))

  function startForLine(idx: number): Point {
    if (idx <= 0) return file.startPoint
    return file.lines[idx - 1]?.endPoint ?? file.startPoint
  }

  const stmtTerm = lang === "java" ? ";" : ""
  const newKw = lang === "java" ? "new " : ""

  const mirrorArg = lang === "java" ? ", isRed" : ""

  function poseCall(p: Point): string {
    return `pose(${fmtNum(p.x)}, ${fmtNum(p.y)}${mirrorArg})`
  }

  function headingCall(deg: number): string {
    return `heading(${fmtDeg(deg)}${mirrorArg})`
  }

  function buildChainBlock(chain: PathChain): string {
    const ident = chainIdent[chain.id]!
    const parts: string[] = []
    chain.lineIds.forEach((lineId, segIdx) => {
      const idx = lineIndex.get(lineId)
      if (idx === undefined) return
      const line = file.lines[idx]!
      const start = startForLine(idx)
      const end = line.endPoint
      const startDeg = line.endPoint.startDeg ?? 0
      const endDeg = line.endPoint.endDeg ?? startDeg
      const headingMode = line.endPoint.heading ?? "linear"

      let curve: string
      const cps = line.controlPoints
      if (cps.length === 0) {
        curve = `${newKw}BezierLine(\n                    ${poseCall(start)}, ${poseCall(end)}\n                )`
      } else {
        const points = [start, ...cps, end].map(poseCall).join(", ")
        curve = `${newKw}BezierCurve(\n                    ${points}\n                )`
      }

      let heading: string
      if (headingMode === "constant") {
        heading = `.setConstantHeadingInterpolation(${headingCall(startDeg)})`
      } else if (headingMode === "tangent") {
        heading = `.setTangentHeadingInterpolation()`
      } else {
        heading = `.setLinearHeadingInterpolation(${headingCall(startDeg)}, ${headingCall(endDeg)})`
      }

      const prefix = segIdx === 0
        ? `            ${ident} = follower.pathBuilder().addPath(`
        : `.addPath(`
      parts.push(`${prefix}\n                ${curve}\n            )${heading}`)
    })
    return parts.join("") + `.build()${stmtTerm}`
  }

  const chainBlocks = chains.map(buildChainBlock).join("\n\n")
  const fieldSize = fmtNum(FIELD_SIZE)

  if (lang === "kotlin") {
    const decls = chains
      .map(
        (c) =>
          `        lateinit var ${chainIdent[c.id]}: PathChain\n            private set`
      )
      .join("\n")
    return `companion object Paths {
${decls}

        fun init(follower: Follower, isRed: Boolean) {
            fun pose(x: Double, y: Double): Pose =
                if (isRed) Pose(${fieldSize} - x, y) else Pose(x, y)
            fun heading(deg: Double): Double =
                Math.toRadians(if (isRed) 180.0 - deg else deg)

${chainBlocks}
        }
    }
`
  }

  const decls = chains
    .map((c) => `        public static PathChain ${chainIdent[c.id]};`)
    .join("\n")
  return `public static class Paths {
${decls}

        public static void init(Follower follower, boolean isRed) {
${chainBlocks}
        }

        private static Pose pose(double x, double y, boolean mirror) {
            return mirror ? new Pose(${fieldSize} - x, y) : new Pose(x, y);
        }

        private static double heading(double deg, boolean mirror) {
            return Math.toRadians(mirror ? 180.0 - deg : deg);
        }
    }
`
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function NumberField({
  label,
  value,
  min,
  step = 0.1,
  onChange,
}: {
  label: string
  value: number | undefined
  min?: number
  step?: number
  onChange: (value: number) => void
}) {
  const id = useId()
  const currentValue = value ?? 0
  const changeBy = (delta: number) => {
    const nextValue = currentValue + delta
    onChange(Number(nextValue.toFixed(4)))
  }

  return (
    <div className="grid min-w-0 gap-1 text-xs text-muted-foreground">
      <label className="min-w-0 truncate" htmlFor={id} title={label}>
        {label}
      </label>
      <div className="flex h-8 min-w-0 overflow-hidden border bg-background focus-within:border-primary">
        <input
          id={id}
          className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm text-foreground outline-none"
          inputMode="decimal"
          type="text"
          value={currentValue}
          onChange={(event) => {
            const nextValue = Number(event.target.value)
            if (!Number.isNaN(nextValue)) {
              onChange(nextValue)
            }
          }}
        />
        <div className="grid w-6 shrink-0 border-l bg-muted/40">
          <button
            aria-label={`Increase ${label}`}
            className="grid min-h-0 place-items-center border-b text-muted-foreground hover:bg-muted hover:text-foreground"
            type="button"
            onClick={() => changeBy(step)}
          >
            <RiAddLine className="size-3" />
          </button>
          <button
            aria-label={`Decrease ${label}`}
            className="grid min-h-0 place-items-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            disabled={min !== undefined && currentValue <= min}
            type="button"
            onClick={() => changeBy(-step)}
          >
            <RiSubtractLine className="size-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const id = useId()

  return (
    <div className="grid min-w-0 gap-1 text-xs text-muted-foreground">
      <label className="min-w-0 truncate" htmlFor={id} title={label}>
        {label}
      </label>
      <input
        id={id}
        className="h-8 w-full min-w-0 border bg-background px-2 text-sm text-foreground outline-none focus:border-primary"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function SwitchRow({
  checked,
  description,
  label,
  onCheckedChange,
}: {
  checked: boolean
  description?: string
  label: string
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 border bg-background p-2 text-xs">
      <span className="min-w-0">
        <span className="block truncate font-medium text-foreground">
          {label}
        </span>
        {description ? (
          <span className="block truncate text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      <button
        aria-checked={checked}
        className={cn(
          "relative h-5 w-9 shrink-0 border transition-colors focus-visible:ring-1 focus-visible:ring-ring/50",
          checked ? "bg-primary" : "bg-muted"
        )}
        role="switch"
        type="button"
        onClick={() => onCheckedChange(!checked)}
      >
        <span
          className={cn(
            "absolute top-1/2 left-0 size-3 -translate-y-1/2 bg-background shadow-sm transition-transform",
            checked ? "translate-x-4" : "translate-x-1"
          )}
        />
      </button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex min-h-[22rem] items-center justify-center border bg-muted/25 p-8 text-center">
      <div className="max-w-sm space-y-3">
        <RiRouteLine className="mx-auto size-10 text-primary" />
        <div>
          <h2 className="text-base font-semibold">
            Load or create a Pedro path
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Import a `.pp` file, open the demo, or start placing path segments
            on the field.
          </p>
        </div>
      </div>
    </div>
  )
}

export function App() {
  const [pathFile, setPathFile] = useState<PedroPathFile | null>(demoPath)
  const [past, setPast] = useState<PedroPathFile[]>([])
  const [future, setFuture] = useState<PedroPathFile[]>([])
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement | null>(null)
  const [fileName, setFileName] = useState("demo.pp")
  const [selectedLineId, setSelectedLineId] = useState<string | null>(
    demoPath.lines[0]?.id ?? null
  )
  const [mode, setMode] = useState<ToolMode>("select")
  const [dragTarget, setDragTarget] = useState<DragTarget | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showShapes, setShowShapes] = useState(true)
  const [showRobot, setShowRobot] = useState(true)
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackProgress, setPlaybackProgress] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isolatedChainId, setIsolatedChainId] = useState<string | null>(null)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [snapRange, setSnapRange] = useState(1)
  const [snapAngle, setSnapAngle] = useState(15)
  const [transformSelection, setTransformSelection] =
    useState<TransformSelection | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastFrameRef = useRef<number | null>(null)
  const dragStartRef = useRef<{ point: Point; pointer: Point } | null>(null)

  const selectedLineIndex = useMemo(() => {
    if (!pathFile || !selectedLineId) {
      return -1
    }

    return pathFile.lines.findIndex((line) => line.id === selectedLineId)
  }, [pathFile, selectedLineId])

  const selectedLine =
    selectedLineIndex >= 0 ? (pathFile?.lines[selectedLineIndex] ?? null) : null

  const drawAnchor = useMemo(() => {
    if (!pathFile) {
      return null
    }

    if (selectedLine) {
      return selectedLine.endPoint
    }

    return (
      pathFile.lines[pathFile.lines.length - 1]?.endPoint ?? pathFile.startPoint
    )
  }, [pathFile, selectedLine])

  const activeChain = useMemo(() => {
    if (!pathFile || !selectedLine) {
      return null
    }

    return (
      pathFile.pathChains?.find((chain) =>
        chain.lineIds.includes(selectedLine.id)
      ) ?? null
    )
  }, [pathFile, selectedLine])

  const routeSamples = useMemo(() => {
    if (!pathFile) {
      return {
        samples: [],
        totalDistance: 0,
        lineEndDistances: {} as Record<string, number>,
      }
    }

    return buildRouteSamples(pathFile)
  }, [pathFile])

  const playbackTimeline = useMemo(() => {
    if (!pathFile) return { entries: [] as TimelineEntry[], totalMs: 0 }
    return buildPlaybackTimeline(pathFile, routeSamples.lineEndDistances, 34)
  }, [pathFile, routeSamples.lineEndDistances])

  const playbackPose = useMemo(
    () =>
      getPlaybackPose(
        routeSamples.samples,
        routeSamples.totalDistance,
        playbackTimeline.entries,
        playbackTimeline.totalMs,
        playbackProgress
      ),
    [
      playbackProgress,
      playbackTimeline.entries,
      playbackTimeline.totalMs,
      routeSamples.samples,
      routeSamples.totalDistance,
    ]
  )

  const playbackLineId =
    isPlaying || playbackProgress > 0 ? (playbackPose?.lineId ?? null) : null

  const visualChain = useMemo(() => {
    if (!pathFile) {
      return null
    }

    if (playbackLineId) {
      return (
        pathFile.pathChains?.find((chain) =>
          chain.lineIds.includes(playbackLineId)
        ) ?? null
      )
    }

    if (isolatedChainId) {
      return (
        pathFile.pathChains?.find((chain) => chain.id === isolatedChainId) ??
        null
      )
    }

    return activeChain
  }, [activeChain, isolatedChainId, pathFile, playbackLineId])

  const robotPose = useMemo(() => {
    if (!pathFile) {
      return null
    }

    if (isPlaying || playbackProgress > 0) {
      return playbackPose
    }

    if (selectedLine) {
      return {
        point: selectedLine.endPoint,
        degrees: getEndPoseDegrees(selectedLine.endPoint),
      }
    }

    return {
      point: pathFile.startPoint,
      degrees: getInitialPoseDegrees(pathFile),
    }
  }, [isPlaying, pathFile, playbackPose, playbackProgress, selectedLine])

  const stats = useMemo(() => {
    if (!pathFile) {
      return { distance: 0, waits: 0, controls: 0 }
    }

    let distance = 0
    let previous: Point = pathFile.startPoint
    for (const line of pathFile.lines) {
      const dx = line.endPoint.x - previous.x
      const dy = line.endPoint.y - previous.y
      distance += Math.hypot(dx, dy)
      previous = line.endPoint
    }

    return {
      distance,
      waits: pathFile.lines.reduce(
        (total, line) =>
          total + (line.waitBeforeMs ?? 0) + (line.waitAfterMs ?? 0),
        0
      ),
      controls: pathFile.lines.reduce(
        (total, line) => total + line.controlPoints.length,
        0
      ),
    }
  }, [pathFile])

  useEffect(() => {
    if (!isPlaying || routeSamples.totalDistance <= 0) {
      return undefined
    }

    const baseMs =
      playbackTimeline.totalMs > 0
        ? playbackTimeline.totalMs
        : (routeSamples.totalDistance / 34) * 1000
    const durationMs = Math.max(2500, baseMs) / playbackSpeed

    function tick(now: number) {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = now
      }

      const delta = now - lastFrameRef.current
      lastFrameRef.current = now

      setPlaybackProgress((current) => {
        const next = Math.min(1, current + delta / durationMs)
        if (next >= 1) {
          setIsPlaying(false)
        }
        return next
      })

      animationFrameRef.current = window.requestAnimationFrame(tick)
    }

    animationFrameRef.current = window.requestAnimationFrame(tick)

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
      animationFrameRef.current = null
      lastFrameRef.current = null
    }
  }, [
    isPlaying,
    playbackSpeed,
    playbackTimeline.totalMs,
    routeSamples.totalDistance,
  ])

  function updatePathFile(updater: (current: PedroPathFile) => PedroPathFile) {
    setPathFile((current) => {
      if (!current) {
        return current
      }
      const next = updater(current)
      if (next !== current) {
        setPast((p) =>
          p.length >= 100 ? [...p.slice(-99), current] : [...p, current]
        )
        setFuture([])
      }
      return next
    })
  }

  useEffect(() => {
    if (!exportMenuOpen) return
    function onClick(e: MouseEvent) {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(e.target as Node)
      ) {
        setExportMenuOpen(false)
      }
    }
    window.addEventListener("mousedown", onClick)
    return () => window.removeEventListener("mousedown", onClick)
  }, [exportMenuOpen])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        return
      }
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      if (e.key === "z" || e.key === "Z") {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (e.key === "y" || e.key === "Y") {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function replacePathFile(next: PedroPathFile | null) {
    setPathFile(next)
    setPast([])
    setFuture([])
  }

  function undo() {
    setPathFile((current) => {
      let popped: PedroPathFile | null | undefined
      setPast((p) => {
        if (p.length === 0) {
          popped = undefined
          return p
        }
        popped = p[p.length - 1]
        return p.slice(0, -1)
      })
      if (popped === undefined) return current
      if (current) setFuture((f) => [...f, current])
      return popped ?? current
    })
  }

  function redo() {
    setPathFile((current) => {
      let popped: PedroPathFile | null | undefined
      setFuture((f) => {
        if (f.length === 0) {
          popped = undefined
          return f
        }
        popped = f[f.length - 1]
        return f.slice(0, -1)
      })
      if (popped === undefined) return current
      if (current) setPast((p) => [...p, current])
      return popped ?? current
    })
  }

  function updateLine(lineId: string, updater: (line: PathLine) => PathLine) {
    updatePathFile((current) => ({
      ...current,
      lines: current.lines.map((line) =>
        line.id === lineId ? updater(line) : line
      ),
    }))
  }

  function updateSetting(key: string, value: unknown) {
    updatePathFile((current) => ({
      ...current,
      settings: {
        ...(current.settings ?? {}),
        [key]: value,
      },
    }))
  }

  function pointerToField(event: React.PointerEvent<SVGElement>) {
    const svg = svgRef.current
    if (!svg) {
      return null
    }

    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) {
      return null
    }

    const svgPoint = point.matrixTransform(ctm.inverse())
    return fromSvgPoint({ x: svgPoint.x, y: svgPoint.y })
  }

  function snapFieldPoint(point: Point) {
    if (!snapToGrid) {
      return normalizePoint(point)
    }

    const step = Math.max(0.1, snapRange)
    return normalizePoint({
      x: Math.round(point.x / step) * step,
      y: Math.round(point.y / step) * step,
    })
  }

  function snapDegrees(degrees: number) {
    if (!snapToGrid) {
      return degrees
    }

    const step = Math.max(1, snapAngle)
    return Math.round(degrees / step) * step
  }

  function getPointForTarget(
    target: PointDragTarget,
    file: PedroPathFile | null = pathFile
  ) {
    if (!file) {
      return null
    }

    if (target.kind === "start") {
      return file.startPoint
    }

    const line = file.lines.find((candidate) => candidate.id === target.lineId)
    if (!line) {
      return null
    }

    if (target.kind === "end") {
      return line.endPoint
    }

    return line.controlPoints[target.index] ?? null
  }

  function setPointForTarget(target: PointDragTarget, point: Point) {
    const nextPoint = snapFieldPoint(point)

    if (target.kind === "start") {
      updatePathFile((current) => ({
        ...current,
        startPoint: {
          ...current.startPoint,
          ...nextPoint,
        },
      }))
      return
    }

    updateLine(target.lineId, (line) => {
      if (target.kind === "end") {
        return {
          ...line,
          endPoint: {
            ...line.endPoint,
            ...nextPoint,
          },
        }
      }

      return {
        ...line,
        controlPoints: line.controlPoints.map((controlPoint, index) =>
          index === target.index ? nextPoint : controlPoint
        ),
      }
    })
  }

  function setRotationForTarget(target: RotationDragTarget, pointer: Point) {
    if (!pathFile) {
      return
    }

    if (target.kind === "rotate-start") {
      const degrees = snapDegrees(
        pointHeadingDegrees(pathFile.startPoint, pointer)
      )
      updatePathFile((current) => ({
        ...current,
        startPoint: {
          ...current.startPoint,
          degrees,
          startDeg: degrees,
          endDeg: degrees,
        },
        lines: current.lines.map((line, i) =>
          i === 0
            ? { ...line, endPoint: { ...line.endPoint, startDeg: degrees } }
            : line
        ),
      }))
      return
    }

    const line = pathFile.lines.find(
      (candidate) => candidate.id === target.lineId
    )
    if (!line) {
      return
    }

    const degrees = snapDegrees(pointHeadingDegrees(line.endPoint, pointer))
    updatePathFile((current) => {
      const idx = current.lines.findIndex((l) => l.id === target.lineId)
      if (idx === -1) return current
      const lines = current.lines.map((l, i) => {
        if (i === idx) {
          return {
            ...l,
            endPoint: { ...l.endPoint, degrees, endDeg: degrees },
          }
        }
        if (i === idx + 1) {
          return { ...l, endPoint: { ...l.endPoint, startDeg: degrees } }
        }
        return l
      })
      return { ...current, lines }
    })
  }

  function revealPointTools(
    event: React.MouseEvent<SVGElement>,
    target: PointDragTarget
  ) {
    event.preventDefault()
    event.stopPropagation()

    if (target.kind !== "start") {
      setSelectedLineId(target.lineId)
    }

    if (!isRotatablePointTarget(target)) {
      setTransformSelection({ mode: "move", target })
      return
    }

    setTransformSelection((current) => {
      const sameTarget =
        current && pointTargetKey(current.target) === pointTargetKey(target)
      return {
        mode: sameTarget && current.mode === "move" ? "rotate" : "move",
        target,
      }
    })
  }

  function addLineAt(point: Point) {
    const id = createId("line")
    updatePathFile((current) => {
      const insertIndex =
        selectedLineIndex >= 0 ? selectedLineIndex + 1 : current.lines.length
      const previousPoint =
        insertIndex > 0
          ? current.lines[insertIndex - 1]?.endPoint
          : current.startPoint
      const previousHeading =
        previousPoint?.endDeg ?? current.startPoint.endDeg ?? 0
      const color =
        activeChain?.color ??
        CHAIN_COLORS[current.lines.length % CHAIN_COLORS.length] ??
        DEFAULT_PATH_COLOR
      const line: PathLine = {
        id,
        name: `Path ${insertIndex + 1}`,
        endPoint: {
          ...point,
          heading: "linear",
          reverse: false,
          startDeg: previousHeading,
          endDeg: previousHeading,
        },
        controlPoints: [],
        color,
        waitBeforeMs: 0,
        waitAfterMs: 0,
        waitBeforeName: "",
        waitAfterName: "",
      }

      const lines = [
        ...current.lines.slice(0, insertIndex),
        line,
        ...current.lines.slice(insertIndex).map((displaced, displacedIndex) =>
          displacedIndex === 0
            ? {
                ...displaced,
                endPoint: {
                  ...displaced.endPoint,
                  startDeg: previousHeading,
                },
              }
            : displaced
        ),
      ].map((candidate, index) => ({
        ...candidate,
        name:
          candidate.id === id || /^Path \d+$/.test(candidate.name)
            ? `Path ${index + 1}`
            : candidate.name,
      }))

      const existingChains = current.pathChains ?? []
      const targetChain =
        activeChain ?? existingChains[existingChains.length - 1]
      const pathChains =
        targetChain && existingChains.length > 0
          ? existingChains.map((chain) => {
              if (chain.id !== targetChain.id) {
                return chain
              }

              const selectedPosition =
                selectedLineId === null
                  ? chain.lineIds.length - 1
                  : chain.lineIds.indexOf(selectedLineId)
              const chainInsertIndex =
                selectedPosition >= 0
                  ? selectedPosition + 1
                  : chain.lineIds.length

              return {
                ...chain,
                lineIds: [
                  ...chain.lineIds.slice(0, chainInsertIndex),
                  id,
                  ...chain.lineIds.slice(chainInsertIndex),
                ],
              }
            })
          : [
              {
                id: createId("chain"),
                name: "Main Chain",
                color,
                lineIds: [id],
              },
            ]

      const sequence = current.sequence ?? []
      const sequenceIndex =
        selectedLineId === null
          ? sequence.length - 1
          : sequence.findIndex((item) => item.lineId === selectedLineId)
      const nextSequence =
        sequenceIndex >= 0
          ? [
              ...sequence.slice(0, sequenceIndex + 1),
              { kind: "path", lineId: id },
              ...sequence.slice(sequenceIndex + 1),
            ]
          : [...sequence, { kind: "path", lineId: id }]

      return {
        ...current,
        lines,
        sequence: nextSequence,
        pathChains,
      }
    })
    setSelectedLineId(id)
    setTransformSelection(null)
    setPlaybackProgress(0)
    setIsPlaying(false)
  }

  function deleteSelectedLine() {
    if (!pathFile || !selectedLine) {
      return
    }

    const removedIndex = pathFile.lines.findIndex(
      (line) => line.id === selectedLine.id
    )
    const inheritedStartDeg =
      removedIndex > 0
        ? (pathFile.lines[removedIndex - 1]?.endPoint.endDeg ??
          pathFile.startPoint.endDeg ??
          0)
        : (pathFile.startPoint.endDeg ?? 0)
    const nextLines = pathFile.lines
      .filter((line) => line.id !== selectedLine.id)
      .map((line, index) =>
        index === removedIndex
          ? {
              ...line,
              endPoint: { ...line.endPoint, startDeg: inheritedStartDeg },
            }
          : line
      )
    updatePathFile((current) => ({
      ...current,
      lines: nextLines,
      sequence: (current.sequence ?? []).filter(
        (item) => item.lineId !== selectedLine.id
      ),
      pathChains: (current.pathChains ?? []).map((chain) => ({
        ...chain,
        lineIds: chain.lineIds.filter((lineId) => lineId !== selectedLine.id),
      })),
    }))
    setSelectedLineId(nextLines[Math.max(0, selectedLineIndex - 1)]?.id ?? null)
    setTransformSelection(null)
  }

  function handlePointerDown(
    event: React.PointerEvent<SVGElement>,
    target?: DragTarget
  ) {
    const point = pointerToField(event)
    if (!point || !pathFile) {
      return
    }

    if (target) {
      if (isPointDragTarget(target)) {
        if (target.kind === "end" || target.kind === "control") {
          setSelectedLineId(target.lineId)
        }

        if (event.button === 2) {
          event.preventDefault()
          event.stopPropagation()
          return
        }

        if (!target.axis) {
          setTransformSelection({ mode: "move", target })
          return
        }
      }

      svgRef.current?.setPointerCapture(event.pointerId)
      setDragTarget(target)
      dragStartRef.current = null

      if (isPointDragTarget(target)) {
        const targetPoint = getPointForTarget(target, pathFile)
        dragStartRef.current = targetPoint
          ? { point: targetPoint, pointer: point }
          : null
      }

      if (target.kind === "end" || target.kind === "control") {
        setSelectedLineId(target.lineId)
      }
      return
    }

    if (mode === "place") {
      const nextPoint = snapFieldPoint(point)
      addLineAt(nextPoint)
      setHoverPoint(nextPoint)
      return
    }

    setSelectedLineId(null)
    setTransformSelection(null)
    setIsolatedChainId(null)
  }

  function handlePathPointerDown(
    event: React.PointerEvent<SVGElement>,
    lineId: string
  ) {
    event.stopPropagation()
    setSelectedLineId(lineId)
    setTransformSelection(null)
  }

  function handleDiagramContextMenu(event: React.MouseEvent<SVGElement>) {
    event.preventDefault()
  }

  function togglePointToolFromContext(
    event: React.MouseEvent<SVGElement>,
    target: PointDragTarget
  ) {
    event.preventDefault()
    event.stopPropagation()
    revealPointTools(event, target)
  }

  function handlePointerMove(event: React.PointerEvent<SVGElement>) {
    const point = pointerToField(event)
    if (mode === "place") {
      setHoverPoint(point ? snapFieldPoint(point) : null)
    }

    if (!dragTarget || !pathFile) {
      return
    }

    if (!point) {
      return
    }

    if (!isPointDragTarget(dragTarget)) {
      setRotationForTarget(dragTarget, point)
      return
    }

    if (dragTarget.axis && dragStartRef.current) {
      const delta = {
        x: point.x - dragStartRef.current.pointer.x,
        y: point.y - dragStartRef.current.pointer.y,
      }
      const nextPoint = {
        x:
          dragTarget.axis === "y"
            ? dragStartRef.current.point.x
            : dragStartRef.current.point.x + delta.x,
        y:
          dragTarget.axis === "x"
            ? dragStartRef.current.point.y
            : dragStartRef.current.point.y + delta.y,
      }

      setPointForTarget(dragTarget, nextPoint)
      return
    }

    setPointForTarget(dragTarget, point)
  }

  function handlePointerUp(event: React.PointerEvent<SVGElement>) {
    if (dragTarget && svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId)
    }
    setDragTarget(null)
    dragStartRef.current = null
  }

  function renderAxisHandles(selection: TransformSelection) {
    if (!pathFile || selection.mode !== "move") {
      return null
    }

    const rotationTarget = selection.target
    const point = getPointForTarget(rotationTarget)
    if (!point) {
      return null
    }

    const center = toSvgPoint(point)
    const xEnd = { x: center.x + 12, y: center.y }
    const yEnd = { x: center.x, y: center.y - 12 }

    return (
      <g
        onContextMenu={(event) =>
          togglePointToolFromContext(event, selection.target)
        }
      >
        <line
          x1={center.x}
          y1={center.y}
          x2={xEnd.x}
          y2={xEnd.y}
          stroke="#ef4444"
          strokeLinecap="round"
          strokeOpacity="0.68"
          strokeWidth="1.1"
        />
        <polygon
          fill="#ef4444"
          fillOpacity="0.68"
          points={`${xEnd.x + 3.2},${xEnd.y} ${xEnd.x},${xEnd.y - 1.8} ${xEnd.x},${xEnd.y + 1.8}`}
        />
        <line
          x1={center.x}
          y1={center.y}
          x2={xEnd.x}
          y2={xEnd.y}
          stroke="transparent"
          strokeLinecap="round"
          strokeWidth="5"
          onPointerDown={(event) => {
            event.stopPropagation()
            handlePointerDown(event, { ...selection.target, axis: "x" })
          }}
        />

        <line
          x1={center.x}
          y1={center.y}
          x2={yEnd.x}
          y2={yEnd.y}
          stroke="#22c55e"
          strokeLinecap="round"
          strokeOpacity="0.68"
          strokeWidth="1.1"
        />
        <polygon
          fill="#22c55e"
          fillOpacity="0.68"
          points={`${yEnd.x},${yEnd.y - 3.2} ${yEnd.x - 1.8},${yEnd.y} ${yEnd.x + 1.8},${yEnd.y}`}
        />
        <line
          x1={center.x}
          y1={center.y}
          x2={yEnd.x}
          y2={yEnd.y}
          stroke="transparent"
          strokeLinecap="round"
          strokeWidth="5"
          onPointerDown={(event) => {
            event.stopPropagation()
            handlePointerDown(event, { ...selection.target, axis: "y" })
          }}
        />
        <rect
          x={center.x + 1.15}
          y={center.y - 6.15}
          width="5"
          height="5"
          fill="#f8fafc"
          fillOpacity="0.58"
          stroke="#334155"
          strokeOpacity="0.75"
          strokeWidth="0.4"
        />
        <rect
          x={center.x - 1.2}
          y={center.y - 8.2}
          width="9.4"
          height="9.4"
          fill="transparent"
          onPointerDown={(event) => {
            event.stopPropagation()
            handlePointerDown(event, { ...selection.target, axis: "xy" })
          }}
        />
      </g>
    )
  }

  function renderRotationHandle(selection: TransformSelection) {
    if (
      !pathFile ||
      selection.mode !== "rotate" ||
      !isRotatablePointTarget(selection.target)
    ) {
      return null
    }

    const rotationTarget = selection.target
    const point = getPointForTarget(rotationTarget)
    if (!point) {
      return null
    }

    const rotationLine =
      rotationTarget.kind === "end"
        ? pathFile.lines.find((line) => line.id === rotationTarget.lineId)
        : null
    const degrees =
      rotationTarget.kind === "start"
        ? getStartPoseDegrees(pathFile.startPoint)
        : rotationLine
          ? getEndPoseDegrees(rotationLine.endPoint)
          : 0
    const center = toSvgPoint(point)
    const vector = degreesToVector(degrees, 10)
    const handle = { x: center.x + vector.x, y: center.y - vector.y }
    const dragTarget: RotationDragTarget =
      rotationTarget.kind === "start"
        ? { kind: "rotate-start" }
        : { kind: "rotate-end", lineId: rotationTarget.lineId }

    return (
      <g
        onContextMenu={(event) =>
          togglePointToolFromContext(event, selection.target)
        }
      >
        <circle
          cx={center.x}
          cy={center.y}
          fill="none"
          r="10"
          stroke="#22c55e"
          strokeDasharray="1.6 1.2"
          strokeWidth="0.6"
        />
        <path
          d={`M ${center.x + 6.2} ${center.y - 7.8} A 10 10 0 0 1 ${center.x + 9.6} ${center.y + 2.8}`}
          fill="none"
          stroke="#22c55e"
          strokeLinecap="round"
          strokeWidth="0.9"
        />
        <circle
          cx={handle.x}
          cy={handle.y}
          fill="#22c55e"
          r="2"
          stroke="#ffffff"
          strokeWidth="0.45"
          onPointerDown={(event) => {
            event.stopPropagation()
            handlePointerDown(event, dragTarget)
          }}
        />
        <circle
          cx={center.x}
          cy={center.y}
          fill="transparent"
          r="13"
          onPointerDown={(event) => {
            event.stopPropagation()
            handlePointerDown(event, dragTarget)
          }}
        />
      </g>
    )
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const text = await file.text()
      const parsed: unknown = JSON.parse(text)
      if (!isPedroPathFile(parsed)) {
        throw new Error("That file does not look like a Pedro .pp path file.")
      }

      const normalized = normalizeFile(parsed)
      replacePathFile(normalized)
      setFileName(file.name.endsWith(".pp") ? file.name : `${file.name}.pp`)
      setSelectedLineId(null)
      setTransformSelection(null)
      setPlaybackProgress(0)
      setIsPlaying(false)
      setIsolatedChainId(null)
      setError(null)
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not read .pp file."
      )
    } finally {
      event.target.value = ""
    }
  }

  function handleExport() {
    if (!pathFile) {
      return
    }

    const output: PedroPathFile = {
      ...pathFile,
      timestamp: new Date().toISOString(),
    }
    const safeName = fileName.trim().endsWith(".pp")
      ? fileName.trim()
      : `${fileName.trim() || "pedro-path"}.pp`
    downloadText(safeName, `${JSON.stringify(output, null, 2)}\n`)
  }

  function exportAsCode(language: "java" | "kotlin") {
    if (!pathFile) return
    const code = buildPathCode(pathFile, language)
    const base = fileName.trim().replace(/\.pp$/i, "") || "PedroPaths"
    const className = toIdentifier(base, true) || "PedroPaths"
    const ext = language === "java" ? "java" : "kt"
    downloadText(`${className}.${ext}`, code)
  }

  function assignSelectedToChain(chainId: string) {
    if (!selectedLine) {
      return
    }

    const targetChainColor =
      pathFile?.pathChains?.find((chain) => chain.id === chainId)?.color ??
      DEFAULT_PATH_COLOR

    updatePathFile((current) => ({
      ...current,
      lines: current.lines.map((line) =>
        line.id === selectedLine.id
          ? {
              ...line,
              color: targetChainColor,
            }
          : line
      ),
      pathChains: (current.pathChains ?? []).map((chain) => {
        const withoutSelected = chain.lineIds.filter(
          (lineId) => lineId !== selectedLine.id
        )
        if (chain.id !== chainId) {
          return { ...chain, lineIds: withoutSelected }
        }

        return { ...chain, lineIds: [...withoutSelected, selectedLine.id] }
      }),
    }))
  }

  function addChain() {
    if (!pathFile) {
      return
    }

    const color =
      CHAIN_COLORS[(pathFile.pathChains ?? []).length % CHAIN_COLORS.length] ??
      DEFAULT_PATH_COLOR
    updatePathFile((current) => ({
      ...current,
      pathChains: [
        ...(current.pathChains ?? []),
        {
          id: createId("chain"),
          name: `Chain ${(current.pathChains ?? []).length + 1}`,
          color,
          lineIds: [],
        },
      ],
    }))
  }

  function selectedStartPoint() {
    if (!pathFile || selectedLineIndex < 0) {
      return null
    }

    return getStartForLine(pathFile, selectedLineIndex)
  }

  function createNewPath() {
    const blank = normalizeFile({
      startPoint: {
        x: FIELD_SIZE / 2,
        y: FIELD_SIZE / 2,
        heading: "linear",
        startDeg: 0,
        endDeg: 0,
      },
      lines: [],
      shapes: demoPath.shapes,
      sequence: [],
      pathChains: [
        {
          id: createId("chain"),
          name: "Main Chain",
          color: DEFAULT_PATH_COLOR,
          lineIds: [],
        },
      ],
      settings: {
        ...demoPath.settings,
        fieldMap: "decode.webp",
        rWidth: 18,
        rHeight: 18,
      },
      version: demoPath.version,
    })
    replacePathFile(blank)
    setFileName("pedro-path.pp")
    setSelectedLineId(null)
    setMode("place")
    setTransformSelection(null)
    setPlaybackProgress(0)
    setIsPlaying(false)
    setIsolatedChainId(null)
    setError(null)
  }

  return (
    <TooltipProvider>
      <div className="min-h-svh bg-background text-foreground">
        <header className="relative z-50 border-b bg-card/70 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-9 place-items-center border bg-primary text-primary-foreground">
                <RiMap2Line className="size-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold">
                  Pedro Path Visualizer
                </h1>
                <p className="truncate text-xs text-muted-foreground">
                  Modern Pedro Path file editor and visualizer with code export
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                className="hidden"
                id="pp-import"
                type="file"
                accept=".pp,application/json"
                onChange={handleImport}
              />
              <Tip label="Undo (Ctrl+Z)">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={undo}
                  disabled={past.length === 0}
                >
                  <RiArrowGoBackLine />
                </Button>
              </Tip>
              <Tip label="Redo (Ctrl+Y / Ctrl+Shift+Z)">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={redo}
                  disabled={future.length === 0}
                >
                  <RiArrowGoForwardLine />
                </Button>
              </Tip>
              <Tip label="Start a fresh empty path">
                <Button variant="outline" size="sm" onClick={createNewPath}>
                  <RiRestartLine />
                  New path
                </Button>
              </Tip>
              <Tip label="Load a .pp file from disk">
                <Button asChild variant="outline" size="sm">
                  <label htmlFor="pp-import">
                    <RiFileUploadLine />
                    Import .pp
                  </label>
                </Button>
              </Tip>
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
                  <div className="absolute right-0 top-full z-[100] mt-1 min-w-[180px] border bg-popover p-1 shadow-md">
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
                    <div className="px-2 pb-1 pt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
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
            </div>
          </div>
        </header>

        <main className="mx-auto grid max-w-[1680px] gap-4 p-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <aside className="min-w-0 space-y-4">
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
                                  onClick={() =>
                                    assignSelectedToChain(chain.id)
                                  }
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

            <section className="border bg-card p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Path list</h2>
                <span className="text-xs text-muted-foreground">
                  {pathFile?.lines.length ?? 0} paths ·{" "}
                  {stats.distance.toFixed(0)}
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
          </aside>

          <section className="min-w-0">
            {pathFile ? (
              <div className="border bg-card p-3">
                <div className="mb-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-semibold">Field</h2>
                      <p className="text-xs text-muted-foreground">
                        Select a point to edit it. Add point places the next
                        path point on the field.
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
                    <div className="flex min-w-0 flex-wrap items-center gap-2 flex-1">
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
                      <Tip label={isPlaying ? "Pause playback" : "Play the path animation"}>
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
                      <Tip label={showRobot ? "Hide the robot footprint" : "Show the robot footprint"}>
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
                      <Tip label={showShapes ? "Hide field goals & shapes" : "Show field goals & shapes"}>
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
                    <div className="flex shrink-0 items-center gap-2 flex-1 justify-end">
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

                <div
                  className={`overflow-hidden border bg-card ${
                    mode === "place"
                      ? "border-primary ring-2 ring-primary/30"
                      : ""
                  }`}
                >
                  <svg
                    ref={svgRef}
                    className={`mx-auto block aspect-square w-full max-w-[min(72vh,900px)] touch-none ${
                      mode === "place" ? "cursor-crosshair" : ""
                    }`}
                    role="img"
                    viewBox={`0 0 ${FIELD_SIZE} ${FIELD_SIZE}`}
                    onContextMenu={handleDiagramContextMenu}
                    onPointerDown={(event) => handlePointerDown(event)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onPointerLeave={() => setHoverPoint(null)}
                  >
                    <defs>
                      <pattern
                        id="small-grid"
                        width={GRID_STEP}
                        height={GRID_STEP}
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d={`M ${GRID_STEP} 0 L 0 0 0 ${GRID_STEP}`}
                          fill="none"
                          stroke="currentColor"
                          strokeOpacity="0.18"
                          strokeWidth="0.25"
                        />
                      </pattern>
                    </defs>

                    <image
                      href="/decode.webp"
                      height={FIELD_SIZE}
                      preserveAspectRatio="none"
                      width={FIELD_SIZE}
                      x="0"
                      y="0"
                    />
                    <rect
                      x="0"
                      y="0"
                      width={FIELD_SIZE}
                      height={FIELD_SIZE}
                      fill="url(#small-grid)"
                      stroke="currentColor"
                      strokeOpacity="0.35"
                      strokeWidth="0.25"
                    />
                    <line
                      x1={FIELD_SIZE / 2}
                      y1="0"
                      x2={FIELD_SIZE / 2}
                      y2={FIELD_SIZE}
                      stroke="#94a3b8"
                      strokeDasharray="2 2"
                      strokeOpacity="0.55"
                      strokeWidth="0.25"
                    />
                    <line
                      x1="0"
                      y1={FIELD_SIZE / 2}
                      x2={FIELD_SIZE}
                      y2={FIELD_SIZE / 2}
                      stroke="#94a3b8"
                      strokeDasharray="2 2"
                      strokeOpacity="0.55"
                      strokeWidth="0.25"
                    />

                    {showShapes
                      ? pathFile.shapes?.map((shape) => (
                          <polygon
                            key={shape.id}
                            fill={shape.fillColor ?? shape.color ?? "#94a3b8"}
                            fillOpacity="0.28"
                            points={shape.vertices
                              .map(toSvgPoint)
                              .map((point) => `${point.x},${point.y}`)
                              .join(" ")}
                            stroke={shape.color ?? "#64748b"}
                            strokeWidth="0.35"
                          />
                        ))
                      : null}

                    {pathFile.lines.map((line, index) => {
                      const start = getStartForLine(pathFile, index)
                      const points = [
                        start,
                        ...line.controlPoints,
                        line.endPoint,
                      ]
                      const chain = pathFile.pathChains?.find((candidate) =>
                        candidate.lineIds.includes(line.id)
                      )
                      const color =
                        line.color ?? chain?.color ?? DEFAULT_PATH_COLOR
                      const selected = selectedLineId === line.id
                      const playbackActive = playbackLineId === line.id
                      const inActiveChain =
                        visualChain?.lineIds.includes(line.id) ?? false
                      const active = playbackLineId
                        ? playbackActive
                        : selected && (!isolatedChainId || inActiveChain)
                      const focused = active || inActiveChain || selected
                      const strokeColor = color
                      const playbackView = Boolean(playbackLineId)
                      const isolateView = Boolean(
                        isolatedChainId && !playbackView
                      )
                      const opacity = active
                        ? 1
                        : playbackView
                          ? inActiveChain
                            ? 0.28
                            : 0.14
                          : isolateView
                            ? inActiveChain
                              ? 0.88
                              : 0.14
                            : inActiveChain
                              ? 0.82
                              : 0.58
                      const strokeWidth = active
                        ? 1.35
                        : inActiveChain
                          ? 0.82
                          : 0.62
                      return (
                        <g key={line.id}>
                          {focused && line.controlPoints.length > 0 ? (
                            <polyline
                              fill="none"
                              points={[
                                start,
                                ...line.controlPoints,
                                line.endPoint,
                              ]
                                .map(toSvgPoint)
                                .map((point) => `${point.x},${point.y}`)
                                .join(" ")}
                              stroke="#64748b"
                              strokeDasharray="2 2"
                              strokeOpacity="0.38"
                              strokeWidth="0.25"
                            />
                          ) : null}
                          <path
                            d={formatPath(points)}
                            fill="none"
                            stroke="transparent"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="5"
                            onPointerDown={(event) =>
                              handlePathPointerDown(event, line.id)
                            }
                          />
                          <path
                            d={formatPath(points)}
                            fill="none"
                            opacity={opacity}
                            pointerEvents="none"
                            stroke={strokeColor}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={strokeWidth}
                          />
                          <polygon
                            fill={strokeColor}
                            opacity={
                              playbackView || isolateView
                                ? Math.max(opacity, focused ? 0.28 : 0.14)
                                : Math.max(opacity, focused ? 0.72 : 0.52)
                            }
                            pointerEvents="none"
                            points={getArrowHeadPoints(points)}
                          />
                        </g>
                      )
                    })}

                    {mode === "place" && drawAnchor && hoverPoint ? (
                      <g>
                        {(() => {
                          const point = toSvgPoint(hoverPoint)
                          return (
                            <circle
                              cx={point.x}
                              cy={point.y}
                              fill="#0f172a"
                              opacity="0.18"
                              r="4.2"
                            />
                          )
                        })()}
                        <path
                          d={formatPath([drawAnchor, hoverPoint])}
                          fill="none"
                          stroke="#0f172a"
                          strokeDasharray="1.5 1.5"
                          strokeLinecap="round"
                          strokeOpacity="0.75"
                          strokeWidth="0.65"
                        />
                        <polygon
                          fill="#0f172a"
                          opacity="0.75"
                          points={getArrowHeadPoints([drawAnchor, hoverPoint])}
                        />
                      </g>
                    ) : null}

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

                    <g>
                      {(() => {
                        const start = toSvgPoint(pathFile.startPoint)
                        const vector = degreesToVector(
                          getStartPoseDegrees(pathFile.startPoint)
                        )
                        return (
                          <g>
                            <circle
                              cx={start.x}
                              cy={start.y}
                              fill="transparent"
                              r="5"
                              onContextMenu={(event) =>
                                revealPointTools(event, { kind: "start" })
                              }
                              onPointerDown={(event) => {
                                event.stopPropagation()
                                handlePointerDown(event, { kind: "start" })
                              }}
                            />
                            <line
                              x1={start.x}
                              y1={start.y}
                              x2={start.x + vector.x}
                              y2={start.y - vector.y}
                              stroke="#111827"
                              strokeWidth="0.35"
                            />
                            <circle
                              cx={start.x}
                              cy={start.y}
                              fill="#111827"
                              r="1.35"
                              stroke="#ffffff"
                              strokeWidth="0.45"
                              onContextMenu={(event) =>
                                revealPointTools(event, { kind: "start" })
                              }
                              onPointerDown={(event) => {
                                event.stopPropagation()
                                handlePointerDown(event, { kind: "start" })
                              }}
                            />
                          </g>
                        )
                      })()}

                      {pathFile.lines.map((line) => {
                        const end = toSvgPoint(line.endPoint)
                        const active = selectedLineId === line.id
                        const inActiveChain =
                          activeChain?.lineIds.includes(line.id) ?? false
                        const focused = active || inActiveChain
                        const vector = degreesToVector(
                          getEndPoseDegrees(line.endPoint)
                        )
                        return (
                          <g key={`points-${line.id}`}>
                            {active ? (
                              <line
                                x1={end.x}
                                y1={end.y}
                                x2={end.x + vector.x}
                                y2={end.y - vector.y}
                                stroke={line.color ?? DEFAULT_PATH_COLOR}
                                strokeOpacity="0.85"
                                strokeWidth="0.35"
                              />
                            ) : null}
                            {focused
                              ? line.controlPoints.map(
                                  (controlPoint, index) => {
                                    const point = toSvgPoint(controlPoint)
                                    return (
                                      <g key={`${line.id}-control-${index}`}>
                                        <rect
                                          fill="transparent"
                                          height="8"
                                          width="8"
                                          x={point.x - 4}
                                          y={point.y - 4}
                                          onContextMenu={(event) =>
                                            revealPointTools(event, {
                                              kind: "control",
                                              lineId: line.id,
                                              index,
                                            })
                                          }
                                          onPointerDown={(event) => {
                                            event.stopPropagation()
                                            handlePointerDown(event, {
                                              kind: "control",
                                              lineId: line.id,
                                              index,
                                            })
                                          }}
                                        />
                                        <rect
                                          fill="#f8fafc"
                                          height="3.2"
                                          stroke="#334155"
                                          strokeWidth="0.45"
                                          width="3.2"
                                          x={point.x - 1.6}
                                          y={point.y - 1.6}
                                          onContextMenu={(event) =>
                                            revealPointTools(event, {
                                              kind: "control",
                                              lineId: line.id,
                                              index,
                                            })
                                          }
                                          onPointerDown={(event) => {
                                            event.stopPropagation()
                                            handlePointerDown(event, {
                                              kind: "control",
                                              lineId: line.id,
                                              index,
                                            })
                                          }}
                                        />
                                      </g>
                                    )
                                  }
                                )
                              : null}
                            <circle
                              cx={end.x}
                              cy={end.y}
                              fill="transparent"
                              r="5"
                              onContextMenu={(event) =>
                                revealPointTools(event, {
                                  kind: "end",
                                  lineId: line.id,
                                })
                              }
                              onPointerDown={(event) => {
                                event.stopPropagation()
                                handlePointerDown(event, {
                                  kind: "end",
                                  lineId: line.id,
                                })
                              }}
                            />
                            <circle
                              cx={end.x}
                              cy={end.y}
                              fill={
                                active
                                  ? "#ffffff"
                                  : (line.color ?? DEFAULT_PATH_COLOR)
                              }
                              opacity={active ? 1 : focused ? 0.75 : 0.3}
                              r={active ? 2.1 : focused ? 1.35 : 0.9}
                              stroke={line.color ?? DEFAULT_PATH_COLOR}
                              strokeWidth={active ? 0.85 : 0.35}
                              onContextMenu={(event) =>
                                revealPointTools(event, {
                                  kind: "end",
                                  lineId: line.id,
                                })
                              }
                              onPointerDown={(event) => {
                                event.stopPropagation()
                                handlePointerDown(event, {
                                  kind: "end",
                                  lineId: line.id,
                                })
                              }}
                            />
                          </g>
                        )
                      })}
                    </g>

                    {transformSelection
                      ? renderAxisHandles(transformSelection)
                      : null}
                    {transformSelection
                      ? renderRotationHandle(transformSelection)
                      : null}

                    {FIELD_TICKS.map((tick) => (
                      <g key={tick}>
                        <line
                          x1={tick}
                          y1={FIELD_SIZE - 1.4}
                          x2={tick}
                          y2={FIELD_SIZE}
                          stroke="currentColor"
                          strokeOpacity="0.45"
                          strokeWidth="0.22"
                        />
                        <line
                          x1="0"
                          y1={FIELD_SIZE - tick}
                          x2="1.4"
                          y2={FIELD_SIZE - tick}
                          stroke="currentColor"
                          strokeOpacity="0.45"
                          strokeWidth="0.22"
                        />
                      </g>
                    ))}
                  </svg>
                  <div className="flex items-center justify-between border-t bg-background px-2 py-1 text-xs text-muted-foreground">
                    <span>Field</span>
                    <span>
                      {FIELD_SIZE}" x {FIELD_SIZE}"
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState />
            )}
          </section>

          <aside className="min-w-0 space-y-4">
            <section className="border bg-card p-3">
              <div className="mb-3 flex items-center gap-2">
                <RiDragMove2Line className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Point editing</h2>
              </div>
              <div className="grid gap-2">
                <SwitchRow
                  checked={snapToGrid}
                  description={`${snapRange} in, ${snapAngle} deg increments`}
                  label="Snap to grid"
                  onCheckedChange={setSnapToGrid}
                />
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    label="Snap range in"
                    min={0.1}
                    step={0.5}
                    value={snapRange}
                    onChange={(value) =>
                      setSnapRange(roundCoord(Math.max(0.1, value)))
                    }
                  />
                  <NumberField
                    label="Snap angle deg"
                    min={1}
                    step={1}
                    value={snapAngle}
                    onChange={(value) =>
                      setSnapAngle(Math.max(1, Math.round(value)))
                    }
                  />
                </div>
              </div>
            </section>

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
                  <TextField
                    label="Name"
                    value={selectedLine.name}
                    onChange={(value) =>
                      updateLine(selectedLine.id, (line) => ({
                        ...line,
                        name: value,
                      }))
                    }
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <NumberField
                      label="End X"
                      value={selectedLine.endPoint.x}
                      onChange={(value) =>
                        updateLine(selectedLine.id, (line) => ({
                          ...line,
                          endPoint: {
                            ...line.endPoint,
                            x: roundCoord(clamp(value)),
                          },
                        }))
                      }
                    />
                    <NumberField
                      label="End Y"
                      value={selectedLine.endPoint.y}
                      onChange={(value) =>
                        updateLine(selectedLine.id, (line) => ({
                          ...line,
                          endPoint: {
                            ...line.endPoint,
                            y: roundCoord(clamp(value)),
                          },
                        }))
                      }
                    />
                    <NumberField
                      label="Start deg"
                      step={1}
                      value={selectedLine.endPoint.startDeg}
                      onChange={(value) =>
                        updatePathFile((current) => {
                          const idx = current.lines.findIndex(
                            (line) => line.id === selectedLine.id
                          )
                          if (idx === -1) return current
                          const lines = current.lines.map((line, i) =>
                            i === idx
                              ? {
                                  ...line,
                                  endPoint: {
                                    ...line.endPoint,
                                    startDeg: value,
                                  },
                                }
                              : i === idx - 1
                                ? {
                                    ...line,
                                    endPoint: {
                                      ...line.endPoint,
                                      endDeg: value,
                                    },
                                  }
                                : line
                          )
                          if (idx === 0) {
                            return {
                              ...current,
                              startPoint: {
                                ...current.startPoint,
                                endDeg: value,
                              },
                              lines,
                            }
                          }
                          return { ...current, lines }
                        })
                      }
                    />
                    <NumberField
                      label="End deg"
                      step={1}
                      value={selectedLine.endPoint.endDeg}
                      onChange={(value) =>
                        updatePathFile((current) => {
                          const idx = current.lines.findIndex(
                            (line) => line.id === selectedLine.id
                          )
                          if (idx === -1) return current
                          const lines = current.lines.map((line, i) => {
                            if (i === idx) {
                              return {
                                ...line,
                                endPoint: { ...line.endPoint, endDeg: value },
                              }
                            }
                            if (i === idx + 1) {
                              return {
                                ...line,
                                endPoint: { ...line.endPoint, startDeg: value },
                              }
                            }
                            return line
                          })
                          return { ...current, lines }
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <NumberField
                      label="Wait before ms"
                      min={0}
                      step={100}
                      value={selectedLine.waitBeforeMs}
                      onChange={(value) =>
                        updateLine(selectedLine.id, (line) => ({
                          ...line,
                          waitBeforeMs: Math.max(0, Math.round(value)),
                        }))
                      }
                    />
                    <NumberField
                      label="Wait after ms"
                      min={0}
                      step={100}
                      value={selectedLine.waitAfterMs}
                      onChange={(value) =>
                        updateLine(selectedLine.id, (line) => ({
                          ...line,
                          waitAfterMs: Math.max(0, Math.round(value)),
                        }))
                      }
                    />
                  </div>

                  <div className="grid gap-1 text-xs text-muted-foreground">
                    Heading mode
                    <select
                      className="h-8 w-full min-w-0 appearance-none border bg-background px-2 text-sm text-foreground outline-none focus:border-primary"
                      value={selectedLine.endPoint.heading ?? "linear"}
                      onChange={(event) =>
                        updateLine(selectedLine.id, (line) => ({
                          ...line,
                          endPoint: {
                            ...line.endPoint,
                            heading: event.target.value,
                          },
                        }))
                      }
                    >
                      <option value="linear">linear</option>
                      <option value="constant">constant</option>
                      <option value="tangent">tangent</option>
                    </select>
                  </div>

                  <SwitchRow
                    checked={Boolean(selectedLine.endPoint.reverse)}
                    description="Sets endPoint.reverse"
                    label="Reverse"
                    onCheckedChange={(checked) =>
                      updateLine(selectedLine.id, (line) => ({
                        ...line,
                        endPoint: {
                          ...line.endPoint,
                          reverse: checked,
                        },
                      }))
                    }
                  />

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium">
                        Control points
                      </span>
                      <div className="flex gap-1">
                        <Tip label="Add a Bezier control point (max 2)">
                          <Button
                            variant="outline"
                            size="icon-xs"
                            onClick={() => {
                              const start = selectedStartPoint()
                              const end = selectedLine.endPoint
                              const point = start
                                ? normalizePoint({
                                    x: (start.x + end.x) / 2,
                                    y: (start.y + end.y) / 2,
                                  })
                                : normalizePoint(end)
                              updateLine(selectedLine.id, (line) => ({
                                ...line,
                                controlPoints: [
                                  ...line.controlPoints,
                                  point,
                                ].slice(0, 2),
                              }))
                            }}
                            disabled={selectedLine.controlPoints.length >= 2}
                          >
                            <RiEdit2Line />
                          </Button>
                        </Tip>
                        <Tip label="Remove the last control point">
                          <Button
                            variant="outline"
                            size="icon-xs"
                            onClick={() =>
                              updateLine(selectedLine.id, (line) => ({
                                ...line,
                                controlPoints: line.controlPoints.slice(0, -1),
                              }))
                          }
                            disabled={selectedLine.controlPoints.length === 0}
                          >
                            <RiSubtractLine />
                          </Button>
                        </Tip>
                      </div>
                    </div>
                    {selectedLine.controlPoints.length === 0 ? (
                      <p className="border bg-background p-2 text-xs text-muted-foreground">
                        Straight segment. Add controls for quadratic or cubic
                        curves.
                      </p>
                    ) : (
                      selectedLine.controlPoints.map((controlPoint, index) => (
                        <div key={index} className="grid grid-cols-2 gap-2">
                          <NumberField
                            label={`C${index + 1} X`}
                            value={controlPoint.x}
                            onChange={(value) =>
                              updateLine(selectedLine.id, (line) => ({
                                ...line,
                                controlPoints: line.controlPoints.map(
                                  (point, pointIndex) =>
                                    pointIndex === index
                                      ? {
                                          ...point,
                                          x: roundCoord(clamp(value)),
                                        }
                                      : point
                                ),
                              }))
                            }
                          />
                          <NumberField
                            label={`C${index + 1} Y`}
                            value={controlPoint.y}
                            onChange={(value) =>
                              updateLine(selectedLine.id, (line) => ({
                                ...line,
                                controlPoints: line.controlPoints.map(
                                  (point, pointIndex) =>
                                    pointIndex === index
                                      ? {
                                          ...point,
                                          y: roundCoord(clamp(value)),
                                        }
                                      : point
                                ),
                              }))
                            }
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <p className="border bg-background p-3 text-sm text-muted-foreground">
                  Select a path segment or add one to edit its coordinates.
                </p>
              )}
            </section>

            <section className="border bg-card p-3">
              <div className="mb-3 flex items-center gap-2">
                <RiFocus3Line className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Start point</h2>
              </div>
              {pathFile ? (
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    label="Start X"
                    value={pathFile.startPoint.x}
                    onChange={(value) =>
                      updatePathFile((current) => ({
                        ...current,
                        startPoint: {
                          ...current.startPoint,
                          x: roundCoord(clamp(value)),
                        },
                      }))
                    }
                  />
                  <NumberField
                    label="Start Y"
                    value={pathFile.startPoint.y}
                    onChange={(value) =>
                      updatePathFile((current) => ({
                        ...current,
                        startPoint: {
                          ...current.startPoint,
                          y: roundCoord(clamp(value)),
                        },
                      }))
                    }
                  />
                  <NumberField
                    label="Start deg"
                    step={1}
                    value={pathFile.startPoint.startDeg}
                    onChange={(value) =>
                      updatePathFile((current) => ({
                        ...current,
                        startPoint: {
                          ...current.startPoint,
                          startDeg: value,
                        },
                      }))
                    }
                  />
                  <NumberField
                    label="End deg"
                    step={1}
                    value={pathFile.startPoint.endDeg}
                    onChange={(value) =>
                      updatePathFile((current) => ({
                        ...current,
                        startPoint: {
                          ...current.startPoint,
                          endDeg: value,
                        },
                        lines: current.lines.map((line, i) =>
                          i === 0
                            ? {
                                ...line,
                                endPoint: { ...line.endPoint, startDeg: value },
                              }
                            : line
                        ),
                      }))
                    }
                  />
                </div>
              ) : null}
            </section>

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
          </aside>
        </main>
      </div>
    </TooltipProvider>
  )
}

export default App
