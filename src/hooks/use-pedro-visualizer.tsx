import { useEffect, useMemo, useRef, useState } from "react"

import { downloadText } from "@/lib/browser-file"
import { buildPathCode, toIdentifier, type CodeLang } from "@/lib/path-codegen"
import {
  CHAIN_COLORS,
  DEFAULT_PATH_COLOR,
  DEFAULT_SYNC_URL,
  FIELD_SIZE,
  PLAYBACK_SPEEDS,
  buildPlaybackTimeline,
  buildRouteSamples,
  clearSessionSnapshot,
  createId,
  degreesToVector,
  demoPath,
  fromSvgPoint,
  getEndPoseDegrees,
  getInitialPoseDegrees,
  getPlaybackPose,
  getStartPoseDegrees,
  getStartForLine,
  isPedroPathFile,
  isPointDragTarget,
  isRotatablePointTarget,
  normalizeFile,
  normalizePoint,
  pointHeadingDegrees,
  pointTargetKey,
  readSessionSnapshot,
  toSvgPoint,
  writeSessionSnapshot,
  type DragTarget,
  type PedroPathFile,
  type PathLine,
  type Point,
  type PointDragTarget,
  type RotationDragTarget,
  type SessionSnapshot,
  type TimelineEntry,
  type ToolMode,
  type TransformSelection,
} from "@/lib/path-domain"

export function usePedroVisualizer() {
  const [pathFile, setPathFile] = useState<PedroPathFile | null>(demoPath)
  const [past, setPast] = useState<PedroPathFile[]>([])
  const [future, setFuture] = useState<PedroPathFile[]>([])
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement | null>(null)
  const [syncMenuOpen, setSyncMenuOpen] = useState(false)
  const syncMenuRef = useRef<HTMLDivElement | null>(null)
  const [syncUrl, setSyncUrl] = useState<string>(() => {
    try {
      return localStorage.getItem("visualizer.syncUrl") || DEFAULT_SYNC_URL
    } catch {
      return DEFAULT_SYNC_URL
    }
  })
  const [syncBusy, setSyncBusy] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{
    kind: "ok" | "err"
    text: string
  } | null>(null)
  const [sessionRecovery, setSessionRecovery] =
    useState<SessionSnapshot | null>(() => readSessionSnapshot())
  const [pwaNotice, setPwaNotice] = useState<
    "offline-ready" | "update-ready" | null
  >(null)
  const [pwaUpdateBusy, setPwaUpdateBusy] = useState(false)
  const [pwaUpdateError, setPwaUpdateError] = useState<string | null>(null)
  useEffect(() => {
    try {
      localStorage.setItem("visualizer.syncUrl", syncUrl)
    } catch {
      /* no storage */
    }
  }, [syncUrl])

  useEffect(() => {
    function handleOfflineReady() {
      setPwaUpdateError(null)
      setPwaNotice((current) =>
        current === "update-ready" ? current : "offline-ready"
      )
    }

    function handleUpdateReady() {
      setPwaUpdateError(null)
      setPwaNotice("update-ready")
    }

    window.addEventListener("visualizer:pwa-offline-ready", handleOfflineReady)
    window.addEventListener("visualizer:pwa-update-ready", handleUpdateReady)

    return () => {
      window.removeEventListener(
        "visualizer:pwa-offline-ready",
        handleOfflineReady
      )
      window.removeEventListener(
        "visualizer:pwa-update-ready",
        handleUpdateReady
      )
    }
  }, [])

  useEffect(() => {
    if (pwaNotice !== "offline-ready") {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setPwaNotice((current) => (current === "offline-ready" ? null : current))
    }, 4500)

    return () => window.clearTimeout(timeout)
  }, [pwaNotice])

  const syncIndicator = useMemo(() => {
    if (syncBusy) {
      return {
        label: "Syncing",
        className: "border-amber-500/40 bg-amber-500/10 text-amber-700",
      }
    }
    if (syncStatus?.kind === "ok") {
      return {
        label: "Synced",
        className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
      }
    }
    if (syncStatus?.kind === "err") {
      return {
        label: "Sync error",
        className: "border-destructive/40 bg-destructive/10 text-destructive",
      }
    }
    return {
      label: "Not synced",
      className: "border-border bg-muted/40 text-muted-foreground",
    }
  }, [syncBusy, syncStatus])

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
  const historyBatchStartRef = useRef<PedroPathFile | null>(null)
  const historyBatchDirtyRef = useRef(false)
  const hasInitializedSessionSaveRef = useRef(false)

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

  const sessionRecoveryTimestamp = useMemo(() => {
    if (!sessionRecovery) {
      return null
    }

    const date = new Date(sessionRecovery.savedAt)
    if (Number.isNaN(date.getTime())) {
      return null
    }

    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }, [sessionRecovery])

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

  function updatePathFile(
    updater: (current: PedroPathFile) => PedroPathFile,
    options: { recordHistory?: boolean } = {}
  ) {
    setPathFile((current) => {
      if (!current) {
        return current
      }
      const next = updater(current)
      if (next !== current) {
        if (options.recordHistory === false) {
          historyBatchDirtyRef.current = true
        } else {
          setPast((p) =>
            p.length >= 100 ? [...p.slice(-99), current] : [...p, current]
          )
          setFuture([])
        }
      }
      return next
    })
  }

  function beginHistoryBatch() {
    historyBatchStartRef.current = pathFile
    historyBatchDirtyRef.current = false
  }

  function commitHistoryBatch() {
    const batchStart = historyBatchStartRef.current
    const batchDirty = historyBatchDirtyRef.current

    historyBatchStartRef.current = null
    historyBatchDirtyRef.current = false

    if (!batchStart || !batchDirty) {
      return
    }

    setPathFile((current) => {
      if (!current || current === batchStart) {
        return current
      }

      setPast((p) =>
        p.length >= 100 ? [...p.slice(-99), batchStart] : [...p, batchStart]
      )
      setFuture([])
      return current
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
    if (!syncMenuOpen) return
    function onClick(e: MouseEvent) {
      if (
        syncMenuRef.current &&
        !syncMenuRef.current.contains(e.target as Node)
      ) {
        setSyncMenuOpen(false)
      }
    }
    window.addEventListener("mousedown", onClick)
    return () => window.removeEventListener("mousedown", onClick)
  }, [syncMenuOpen])

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

  function restoreSession(snapshot: SessionSnapshot) {
    const normalized = normalizeFile(snapshot.pathFile)
    const selectedExists = snapshot.selectedLineId
      ? normalized.lines.some((line) => line.id === snapshot.selectedLineId)
      : false
    const clampedSpeed = PLAYBACK_SPEEDS.includes(
      snapshot.playbackSpeed as (typeof PLAYBACK_SPEEDS)[number]
    )
      ? snapshot.playbackSpeed
      : 1
    const clampedSnapRange = Math.max(0.1, snapshot.snapRange)
    const clampedSnapAngle = Math.max(1, snapshot.snapAngle)

    replacePathFile(normalized)
    setFileName(snapshot.fileName || "pedro-path.pp")
    setSelectedLineId(selectedExists ? snapshot.selectedLineId : null)
    setMode(snapshot.mode)
    setShowShapes(snapshot.showShapes)
    setShowRobot(snapshot.showRobot)
    setPlaybackSpeed(clampedSpeed)
    setIsolatedChainId(snapshot.isolatedChainId)
    setSnapToGrid(snapshot.snapToGrid)
    setSnapRange(clampedSnapRange)
    setSnapAngle(clampedSnapAngle)
    setSyncUrl(snapshot.syncUrl || DEFAULT_SYNC_URL)
    setTransformSelection(null)
    setDragTarget(null)
    setPlaybackProgress(0)
    setIsPlaying(false)
    setHoverPoint(null)
    setError(null)
    setExportMenuOpen(false)
    setSyncMenuOpen(false)
    setSessionRecovery(null)
    clearSessionSnapshot()
  }

  function dismissSessionRecovery() {
    setSessionRecovery(null)
    clearSessionSnapshot()
  }

  useEffect(() => {
    if (!hasInitializedSessionSaveRef.current) {
      hasInitializedSessionSaveRef.current = true
      return
    }

    if (!pathFile) {
      clearSessionSnapshot()
      return
    }

    const snapshot: SessionSnapshot = {
      version: 1,
      savedAt: new Date().toISOString(),
      pathFile,
      fileName,
      selectedLineId,
      mode,
      showShapes,
      showRobot,
      playbackSpeed,
      isolatedChainId,
      snapToGrid,
      snapRange,
      snapAngle,
      syncUrl,
    }

    writeSessionSnapshot(snapshot)
  }, [
    fileName,
    isolatedChainId,
    mode,
    pathFile,
    playbackSpeed,
    selectedLineId,
    showRobot,
    showShapes,
    snapAngle,
    snapRange,
    snapToGrid,
    syncUrl,
  ])

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

  function updateLine(
    lineId: string,
    updater: (line: PathLine) => PathLine,
    options?: { recordHistory?: boolean }
  ) {
    updatePathFile(
      (current) => ({
        ...current,
        lines: current.lines.map((line) =>
          line.id === lineId ? updater(line) : line
        ),
      }),
      options
    )
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

  function setPointForTarget(
    target: PointDragTarget,
    point: Point,
    options?: { recordHistory?: boolean }
  ) {
    const nextPoint = snapFieldPoint(point)

    if (target.kind === "start") {
      updatePathFile(
        (current) => ({
          ...current,
          startPoint: {
            ...current.startPoint,
            ...nextPoint,
          },
        }),
        options
      )
      return
    }

    updateLine(
      target.lineId,
      (line) => {
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
      },
      options
    )
  }

  function setRotationForTarget(
    target: RotationDragTarget,
    pointer: Point,
    options?: { recordHistory?: boolean }
  ) {
    if (!pathFile) {
      return
    }

    if (target.kind === "rotate-start") {
      const degrees = snapDegrees(
        pointHeadingDegrees(pathFile.startPoint, pointer)
      )
      updatePathFile(
        (current) => ({
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
        }),
        options
      )
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
    }, options)
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
      beginHistoryBatch()

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
      setRotationForTarget(dragTarget, point, { recordHistory: false })
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

      setPointForTarget(dragTarget, nextPoint, { recordHistory: false })
      return
    }

    setPointForTarget(dragTarget, point, { recordHistory: false })
  }

  function handlePointerUp(event: React.PointerEvent<SVGElement>) {
    if (dragTarget && svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId)
    }
    commitHistoryBatch()
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

  async function handleSync() {
    if (!pathFile || syncBusy) return
    setSyncBusy(true)
    setSyncStatus(null)
    const base = syncUrl.replace(/\/+$/, "")
    try {
      const infoRes = await fetch(`${base}/info`)
      if (!infoRes.ok) throw new Error(`server replied ${infoRes.status}`)
      const info = (await infoRes.json()) as {
        language?: CodeLang
        target?: string
      }
      if (info.language !== "java" && info.language !== "kotlin") {
        throw new Error("server did not report a known language")
      }
      const code = buildPathCode(pathFile, info.language)
      const syncRes = await fetch(`${base}/sync`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ language: info.language, code }),
      })
      const result = (await syncRes.json()) as {
        ok: boolean
        replaced?: boolean
        error?: string
        hint?: string
      }
      if (!result.ok) {
        throw new Error(
          result.hint
            ? `${result.error || "sync failed"}. ${result.hint}`
            : result.error || "sync failed"
        )
      }
      const summary = result.replaced ? "synced path block" : "sync completed"
      setSyncStatus({ kind: "ok", text: summary })
    } catch (e) {
      setSyncStatus({
        kind: "err",
        text: e instanceof Error ? e.message : "sync failed",
      })
    } finally {
      setSyncBusy(false)
    }
  }

  async function applyPwaUpdate() {
    if (pwaUpdateBusy) {
      return
    }

    const update = window.__visualizerApplyPwaUpdate
    if (!update) {
      setPwaUpdateError(
        "Update service is still starting. Try again in a moment."
      )
      return
    }

    setPwaUpdateBusy(true)
    setPwaUpdateError(null)

    try {
      await update(true)
    } catch (error) {
      setPwaUpdateError(
        error instanceof Error ? error.message : "Could not apply update."
      )
    } finally {
      setPwaUpdateBusy(false)
    }
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

  function deleteChain(chainId: string) {
    if (!pathFile) {
      return
    }

    const chain = pathFile.pathChains?.find(
      (candidate) => candidate.id === chainId
    )
    if (!chain) {
      return
    }

    const deletedLineIds = new Set(chain.lineIds)
    const firstDeletedIndex = pathFile.lines.findIndex((line) =>
      deletedLineIds.has(line.id)
    )
    const previewLines = pathFile.lines.filter(
      (line) => !deletedLineIds.has(line.id)
    )
    const nextSelectedLineId =
      selectedLineId && deletedLineIds.has(selectedLineId)
        ? (previewLines[Math.min(firstDeletedIndex, previewLines.length - 1)]
            ?.id ?? null)
        : selectedLineId

    updatePathFile((current) => {
      const currentChain = current.pathChains?.find(
        (candidate) => candidate.id === chainId
      )
      const lineIdsToDelete = new Set(currentChain?.lineIds ?? [])
      const originalIndexById = new Map(
        current.lines.map((line, index) => [line.id, index])
      )
      const lines = current.lines
        .filter((line) => !lineIdsToDelete.has(line.id))
        .map((line, index, keptLines) => {
          const originalIndex = originalIndexById.get(line.id) ?? index
          const previousOriginalLine = current.lines[originalIndex - 1]
          const followsDeletedLine =
            previousOriginalLine && lineIdsToDelete.has(previousOriginalLine.id)

          if (index !== 0 && !followsDeletedLine) {
            return line
          }

          const previousPoint =
            index > 0 ? keptLines[index - 1]?.endPoint : current.startPoint
          const startDeg =
            previousPoint?.endDeg ?? current.startPoint.endDeg ?? 0

          return {
            ...line,
            endPoint: {
              ...line.endPoint,
              startDeg,
            },
          }
        })

      return {
        ...current,
        lines,
        sequence: (current.sequence ?? []).filter(
          (item) => !lineIdsToDelete.has(item.lineId ?? "")
        ),
        pathChains: (current.pathChains ?? [])
          .filter((candidate) => candidate.id !== chainId)
          .map((candidate) => ({
            ...candidate,
            lineIds: candidate.lineIds.filter(
              (lineId) => !lineIdsToDelete.has(lineId)
            ),
          })),
      }
    })

    setSelectedLineId(nextSelectedLineId)
    setIsolatedChainId((current) => (current === chainId ? null : current))
    setTransformSelection(null)
    setPlaybackProgress(0)
    setIsPlaying(false)
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

  return {
    activeChain,
    addChain,
    applyPwaUpdate,
    assignSelectedToChain,
    createNewPath,
    deleteChain,
    deleteSelectedLine,
    dismissSessionRecovery,
    dragTarget,
    drawAnchor,
    error,
    exportAsCode,
    exportMenuOpen,
    exportMenuRef,
    fileName,
    future,
    handleDiagramContextMenu,
    handleExport,
    handleImport,
    handlePathPointerDown,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleSync,
    hoverPoint,
    isPlaying,
    isolatedChainId,
    mode,
    past,
    pathFile,
    playbackLineId,
    playbackPose,
    playbackProgress,
    playbackSpeed,
    playbackTimeline,
    pwaNotice,
    pwaUpdateBusy,
    pwaUpdateError,
    renderAxisHandles,
    renderRotationHandle,
    redo,
    revealPointTools,
    restoreSession,
    robotPose,
    routeSamples,
    selectedLine,
    selectedLineId,
    selectedLineIndex,
    selectedStartPoint,
    sessionRecovery,
    sessionRecoveryTimestamp,
    setError,
    setExportMenuOpen,
    setFileName,
    setHoverPoint,
    setIsolatedChainId,
    setIsPlaying,
    setMode,
    setPlaybackProgress,
    setPlaybackSpeed,
    setPwaNotice,
    setPwaUpdateError,
    setSelectedLineId,
    setShowRobot,
    setShowShapes,
    setSnapAngle,
    setSnapRange,
    setSnapToGrid,
    setSyncMenuOpen,
    setSyncUrl,
    setTransformSelection,
    showRobot,
    showShapes,
    snapAngle,
    snapRange,
    snapToGrid,
    stats,
    svgRef,
    syncBusy,
    syncIndicator,
    syncMenuOpen,
    syncMenuRef,
    syncStatus,
    syncUrl,
    togglePointToolFromContext,
    transformSelection,
    undo,
    updateLine,
    updatePathFile,
    updateSetting,
    visualChain,
  }
}

export type PedroVisualizerViewModel = ReturnType<typeof usePedroVisualizer>
