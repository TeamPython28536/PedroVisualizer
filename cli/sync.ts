#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { resolve, extname } from "node:path"

type Lang = "java" | "kotlin"

const args = process.argv.slice(2)
const fileArg = args.find((a) => !a.startsWith("--"))
if (!fileArg) {
  console.error("usage: bun cli/sync.ts <path-to-source-file> [--port 7777] [--token <token>]")
  process.exit(1)
}

const target = resolve(fileArg)
if (!existsSync(target)) {
  console.error(`file not found: ${target}`)
  process.exit(1)
}

const ext = extname(target).toLowerCase()
let lang: Lang
if (ext === ".java") lang = "java"
else if (ext === ".kt" || ext === ".kts") lang = "kotlin"
else {
  console.error(`unsupported extension "${ext}" — expected .java, .kt, or .kts`)
  process.exit(1)
}

const portIdx = args.indexOf("--port")
const port = portIdx >= 0 ? Number(args[portIdx + 1]) : 7777
const tokenIdx = args.indexOf("--token")
const token = tokenIdx >= 0 ? args[tokenIdx + 1] : undefined

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization",
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders() },
  })
}

function replaceBlock(
  source: string,
  code: string
): { next: string; replaced: boolean } {
  const re =
    /([ \t]*\/\/[ \t]*VISUALIZER_PATH_BEGIN[^\n]*\n)([\s\S]*?)([ \t]*\/\/[ \t]*VISUALIZER_PATH_END[^\n]*)/
  const match = source.match(re)
  if (!match) return { next: source, replaced: false }
  const indent = match[1].match(/^[ \t]*/)?.[0] ?? ""
  const reindented = code
    .split("\n")
    .map((line) => (line.length > 0 ? indent + line : line))
    .join("\n")
  const next = source.replace(
    re,
    `$1${reindented}${reindented.endsWith("\n") ? "" : "\n"}$3`
  )
  return { next, replaced: true }
}

const server = Bun.serve({
  port,
  fetch(req) {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() })
    }

    const url = new URL(req.url)

    if (req.method === "GET" && url.pathname === "/info") {
      return json({ ok: true, target, language: lang })
    }

    if (req.method === "POST" && url.pathname === "/sync") {
      if (token) {
        const auth = req.headers.get("authorization")
        if (auth !== `Bearer ${token}`) {
          return json({ ok: false, error: "unauthorized" }, 401)
        }
      }
      return req.json().then((body: unknown) => {
        const payload = body as {
          language?: Lang
          code?: string
        }
        if (!payload || typeof payload !== "object" || typeof payload.code !== "string") {
          return json({ ok: false, error: "missing code" }, 400)
        }
        if (payload.language && payload.language !== lang) {
          return json(
            {
              ok: false,
              error: `target file is ${lang}, payload language is ${payload.language}`,
            },
            400
          )
        }
        const source = readFileSync(target, "utf8")
        const { next, replaced } = replaceBlock(source, payload.code)
        if (!replaced) {
          return json(
            {
              ok: false,
              error: "no markers matched",
              hint: `add "// VISUALIZER_PATH_BEGIN" and "// VISUALIZER_PATH_END" in ${target}`,
            },
            422
          )
        }
        if (next !== source) writeFileSync(target, next, "utf8")
        console.log(
          `[sync] ${new Date().toLocaleTimeString()} replaced VISUALIZER_PATH block`
        )
        return json({ ok: true, replaced: true })
      })
    }

    return json({ ok: false, error: "not found" }, 404)
  },
})

console.log(`visualizer sync listening on http://localhost:${server.port}`)
console.log(`watching: ${target}`)
console.log(`language: ${lang}`)
if (token) console.log(`token required`)
console.log(
  `add markers in your file like:\n  // VISUALIZER_PATH_BEGIN\n  // VISUALIZER_PATH_END\n(and place them around your whole Paths companion/static block)`
)
