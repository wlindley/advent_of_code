# `shared/core`

## Consumer Guide
Pure, runtime-agnostic contracts and reusable domain utilities shared across Advent of Code puzzle solvers, `tools/aoc/`, and `site/`.

### Public API (`shared/core/index.ts`)
- `PuzzleSolver<TInput, TAnswer, TTrace>`: standard interface implemented by every puzzle part's domain module (`parse`, `solve`, optional `trace`).
- `PuzzleMeta` & `PuzzlePartManifest`: metadata and browser registration shape for solved parts.
- `executeSolver(solver, rawInput, clock?)`: executes `parse` + `solve` and returns `{ answer, elapsedMs, runtime }`.
- `formatDayFolder(day)` / `formatPartKey(year, day, part)`: canonical path/ID formatters with boundary validation.
- `euclideanMod(dividend, divisor)`: non-negative Euclidean modulo in `[0, divisor)` with safe-integer validation.
- `Grid2D<T>`, `DIRS_4`, `DIRS_8`, `GridDelta`: immutable rectangular row-major grid parser/container and frozen orthogonal/8-way direction vectors.
- `ClosedInterval`, `IntervalUnion`: immutable `bigint` inclusive `[start, end]` interval and sorted disjoint non-adjacent interval union with $O(\log K)$ binary-search lookup.
- `Clock` & `systemClock`: injectable monotonic timing boundary for deterministic tests.

## Maintainer Guide
- **Strict DAG rule**: `shared/core` sits at the bottom of the dependency graph. Never import from `shared/viz`, `site/`, `tools/`, or any `<year>/` folder, and never reference DOM/React APIs so solvers run identically in Node CLI and browsers/Web Workers.
- **On-demand promotion**: Only promote general-purpose algorithms (grids, graph search, number theory, Worker pools) here when real puzzles need them, with ~100% branch coverage tests.
