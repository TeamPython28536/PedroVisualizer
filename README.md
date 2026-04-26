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
