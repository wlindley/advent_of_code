# 2022 Day 8 Part 1 — Treetop Tree House (`2022/day08/part1`)

Counts how many trees in a rectangular height grid (`0..9`) are visible from at least one cardinal edge (`UP`, `RIGHT`, `DOWN`, `LEFT`).

## Consumer Interface

- `domain/visibility.ts`: exports `DEFAULT_MAX_TRACE_STEPS` (`120`), `VisibilitySweepTimeline`, `VisibilityTraceFrame`, `countVisibleTrees`, and `traceVisibility`.
- `domain/solver.ts`: exports `solver` (`TreeVisibilitySolver` implementing `PuzzleSolver<ForestGrid, number, VisibilityTraceFrame>`).
- `index.ts`: exports `manifest` (`PuzzlePartManifest`) with the 5×5 official `exampleInput`, `exampleAnswer` (`"21"`), `solver`, and `TreeVisibilityVisualizer`.
- `viz/TreeVisibilityVisualizer.tsx`: interactive wavefront sweep playback and 4-way sightline inspector over `CanopySightlineSvg`.

## Maintainer Architecture

- **Thin Part Layer**: `part1/domain` delegates grid parsing (`ForestGrid`) and 4-pass monotonic-stack analysis (`ForestSightlines`) to `2022/day08/shared`, then derives a shared `VisibilitySweepTimeline` with zero per-frame grid copies.
- **Bounded Visualization**: `traceVisibility` samples at most `120` wavefront frames across the `2 * (R + C)` sweep lines, and `CanopySightlineSvg` batches cells into 20 `<path>` elements so `99 × 99` grids render smoothly.
