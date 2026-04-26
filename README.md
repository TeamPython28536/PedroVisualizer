# Pedro Path Visualizer

A web app for editing FTC Pedro Pathing autonomous routes. Drop in a `.pp`
file, drag points around, set headings, and export back to `.pp` or to Java
or Kotlin source you can paste into your `Auto` opmode.

Built for 141.5 inch fields (DECODE).

## Running it

```
bun install
bun run dev
```

Then open the URL Vite prints. There's nothing else to set up.

To build a static bundle:

```
bun run build
```

Output goes to `dist/`.

## What it does

- Loads and saves `.pp` files (the same JSON format the upstream visualizer
  uses).
- Click "Add point" to drop new path segments. Drag any point to move it,
  drag the rotation handle to set heading.
- Each segment has its own start/end heading. Editing one end propagates so
  the chain stays continuous instead of snapping at boundaries.
- Multiple chains (Score Preload, Intake 1, etc.) with focus / isolate so
  you can work on one piece of the auto without the rest in the way.
- Bezier control points (up to 2) for curved segments.
- Wait-aware playback: `waitBeforeMs` / `waitAfterMs` actually pause the
  preview robot at the right place.
- Undo / redo (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y).
- Export to Java or Kotlin in the format Pedro Pathing expects:
  `BezierLine` / `BezierCurve` plus `setLinearHeadingInterpolation` chained
  through `pathBuilder()`, one block per chain.

## Sync to your robot codebase

Instead of copy-pasting export output every time, run the sync server
inside your robot code repo:

```
bun run sync path/to/Auto.java
```

(or `Auto.kt` — language is picked from the file extension). It listens on
`http://localhost:7777`. In the visualizer, click **Sync** in the header
and hit **Sync now**.

In the target file, mark the region you want overwritten:

```java
// VISUALIZER_PATH_BEGIN
// VISUALIZER_PATH_END
```

Java template:

```java
public class AutoPaths {
  // VISUALIZER_PATH_BEGIN
  public static class Paths {
    public static void init(Follower follower, boolean isRed) {

    }
  }
  // VISUALIZER_PATH_END
}
```

Kotlin template:

```kotlin
class AutoPaths {
  // VISUALIZER_PATH_BEGIN
  companion object Paths {
    fun init(follower: Follower, isRed: Boolean) {

    }
  }
  // VISUALIZER_PATH_END
}
```

The sync server rewrites whatever sits between `BEGIN`/`END`, preserving
the indentation of the marker line. It writes the full generated path code
block (all chains together) in one replace, and leaves everything outside
the markers untouched. In practice, put markers around the whole
`Paths` companion/static object so sync can safely add/remove generated
path fields and path chains over time.

If the marker pair is missing, sync fails with a hint and the file is not
changed.

## Heading convention

Each waypoint stores a `startDeg` (heading entering) and `endDeg` (heading
leaving). The very first heading comes from the first segment's `startDeg`,
not the start point's, which matches what the upstream visualizer does.
Within a segment, headings interpolate linearly (or stay constant, or
follow the path tangent, depending on the mode you pick). Across segment
boundaries the next segment's start follows the previous segment's end so
playback never snaps.

## Stack

React 19, Vite, Tailwind 4, Radix UI primitives, Remixicon. No backend.

## Credit

This project is a rewrite and extension of the original Pedro Pathing
Visualizer:

https://github.com/Pedro-Pathing/Visualizer

The `.pp` file format, the field and goal layout, and a lot of the editing
ideas come from there. If you're shipping an auto for a real Pedro Pathing
robot, keep that one bookmarked too.
