# Day 09 Part 1 — Movie Theater

Finds the largest inclusive axis-aligned tile rectangle formed by any two red tiles on the theater floor.

## Consumer Guide

- **Domain API** (`2025/day09/part1/domain`):
  - `solver`: `PuzzleSolver<readonly TilePoint[], bigint, SkylineTraceFrame>` (`parse`, `solve`, `trace`).
  - `findLargestTileRectangle(points)`: Returns the canonical best `RectangleMatch` (`indexA < indexB`) and the four Pareto frontier index lists (`swIndices`, `neIndices`, `nwIndices`, `seIndices`).
  - `traceLargestTileRectangle(points, options?)`: Emits bounded probe frames (`DEFAULT_MAX_TRACE_STEPS = 120`) across both skyline passes for visualization.
- **Visualizer** (`TheaterSkylineVisualizer`): Renders the closed theater polygon, red tile coordinates, active pass Pareto staircases with D&C search window, candidate rectangle, and best-so-far rectangle with playback controls.

## Maintainer Notes

- **Two-Pass Pareto Skyline + Monotone D&C (`O(N log N)`)**: Every maximum rectangle has corners on opposing Pareto staircases (`SW→NE` or `NW→SE` via `y -> -y` reflection).
- **Concave-Monge Invariant**: `searchMonotoneMax` scores raw unclamped `(b.x - a.x + 1n) * (b.y - a.y + 1n)` without clamping invalid pairs or skipping self-matches. Because both staircases come from the same point set, invalid pairs score `<= 0n < 1n` and the score matrix stays strictly concave-Monge across the entire window.
- **Pure Domain**: Zero DOM/React imports inside `domain/` and `shared/`.
