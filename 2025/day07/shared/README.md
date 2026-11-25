# `2025/day07/shared`

## Consumer Guide
Shared pure-TypeScript tachyon manifold domain model for Advent of Code 2025 Day 7 ("Laboratories").

### Public API (`2025/day07/shared/index.ts`)
- `ManifoldCell`: `'.' | 'S' | '^'`
- `TachyonManifold`: immutable frozen wrapper around `Grid2D<ManifoldCell>` storing `grid`, `startRow`, and `startCol`, with computed `rows`, `cols`, `splitterCount`, `isSplitter(row, col)`, and `TachyonManifold.parse(raw)`.

## Maintainer Guide
- **Single Source of Truth**: Dimensions (`rows`, `cols`) and `splitterCount` are computed dynamically from `grid` rather than stored.
- **Boundary Validation**: `TachyonManifold.parse` enforces rectangular input via `Grid2D.fromLines`, rejects unknown characters with row/column context, and enforces exactly one `'S'` emitter; the constructor also validates `(startRow, startCol)` directly.
