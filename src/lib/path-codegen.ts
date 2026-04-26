import {
  FIELD_SIZE,
  type PathChain,
  type PedroPathFile,
  type Point,
} from "@/lib/path-domain"

export function toIdentifier(input: string, pascal = true): string {
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

export type CodeLang = "java" | "kotlin"

function buildChainCode(file: PedroPathFile, lang: CodeLang) {
  const chains = (file.pathChains ?? []).filter((c) => c.lineIds.length > 0)
  const usedNames = new Set<string>()
  const chainIdent: Record<string, string> = {}
  for (const chain of chains) {
    const base = toIdentifier(chain.name || "Chain", true) || "Chain"
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

  function chainBlock(chain: PathChain): string {
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

      const prefix =
        segIdx === 0
          ? `            ${ident} = follower.pathBuilder().addPath(`
          : `.addPath(`
      parts.push(`${prefix}\n                ${curve}\n            )${heading}`)
    })
    return parts.join("") + `.build()${stmtTerm}`
  }

  return { chains, chainIdent, chainBlock }
}

export function buildPathCode(file: PedroPathFile, lang: CodeLang): string {
  const { chains, chainIdent, chainBlock } = buildChainCode(file, lang)
  const chainBlocks = chains.map(chainBlock).join("\n\n")
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
