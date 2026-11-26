# Day 09 Part 2 — Movie Theater (Part Two)

Finds the largest inclusive axis-aligned tile rectangle defined by two red tiles that lies entirely within the closed orthogonal red/green polygon.

## Consumer Guide

- **Domain API** (`2025/day09/part2/domain`):
  - `CompressedAxis`: Immutable gap-preserving 1D BigInt coordinate compression (`slabs`, `size`, `indexOfPoint`).
  - `PolygonTileGrid`: Validates an orthogonal loop (`>= 4` vertices, no zero-length or diagonal edges) and provides `O(1)` rectangle containment queries (`containsRect`, `invalidCellsInBox`, `invalidCellsInRect`, `isCellValid`).
  - `solver`: `PuzzleSolver<readonly TilePoint[], bigint, InscribedTraceFrame>` (`parse`, `solve`, `trace`).
  - `findLargestInscribedRectangle(points)`: Returns the canonical best `InscribedRectangleMatch` (`indexA < indexB`), the `PolygonTileGrid`, and `checkedPairs`/`rejectedPairs` counts.
  - `traceLargestInscribedRectangle(points, options?)`: Emits deterministically sampled trace frames (default `DEFAULT_MAX_TRACE_STEPS = 120`) for visualization.
- **Visualizer** (`TheaterPolygonVisualizer`): Renders the closed green theater loop, current best inscribed rectangle, active candidate rectangle (emerald when accepted, crimson when rejected), red tile vertices, and interactive playback controls.

## Maintainer Notes

- **Gap-Preserving Compression (`CompressedAxis`)**: Emits point slabs `[u, u]` for each unique vertex coordinate and inserts gap slabs `[u + 1, next - 1]` strictly when `next - u > 1n`, preserving exact zero-gap adjacency semantics without inflating huge coordinates.
- **Half-Open Parity Scanline (`PolygonTileGrid`)**: Marks all boundary cells along horizontal and vertical edges, then toggles `parityDiff` on half-open vertical spans `[cyLo, cyHi)` (representing a ray at `y + 0.5`). This avoids double-toggling at shared vertices and horizontal edges while correctly sealing exterior pockets behind zero-gap pinches.
- **Area-Pruned Search**: Precomputes compressed vertex indices and skips pairs whose raw BigInt area `<= bestArea`, both pruning O(1) prefix-sum queries and guaranteeing canonical lexicographical `(indexA, indexB)` tie-breaking.
- **Pure Domain**: Zero DOM/React imports inside `domain/` and `shared/`.
