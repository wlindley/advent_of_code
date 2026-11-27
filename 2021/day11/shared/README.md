# 2021 Day 11 — Shared Dumbo Octopus Domain

## Consumer Guide

Import the pure TypeScript domain model from `2021/day11/shared` (zero DOM/React dependencies):

- `OctopusGrid` / `parseOctopusGrid(raw)` — parses and validates rectangular digit grids with integer energy levels in `[0, 9]`.
- `OctopusStepper` — stateful typed-array BFS flash-cascade simulator exposing `step()` and immutable `snapshot()`.
- `OctopusSolver(policy)` — implements `PuzzleSolver<OctopusGrid, number, OctopusStepFrame>` using `TOTAL_FLASHES_100_POLICY` (Part 1) or `FIRST_SYNC_STEP_POLICY` (Part 2).
- `OctopusStepFrame` & `captureSampledTrace(grid, flashHistory, maxSteps)` — endpoint-preserving sampled trace frames with dynamically derived `stepFlashes`, `totalFlashes`, `isSynchronized`, and `flashedAt(row, col)`.

Interactive React components live separately under `2021/day11/shared/viz/` (`OctopusVisualizer`, `OctopusGridSvg`, `FlashSparklineSvg`).

## Maintainer Guide

One-way module DAG:

`grid.ts` -> `parser.ts` -> `stepper.ts` -> `trace.ts` -> `policy.ts` -> `solver.ts` -> `index.ts`

Invariants:
- **Single-flash BFS guarantee**: `OctopusStepper` enqueues a cell only when its energy crosses `FLASH_THRESHOLD` (`10`) during initial increment or 8-neighbor propagation, then resets queued indices to `0` at step end.
- **No frozen typed arrays**: `OctopusStepper` keeps `energy` (`Uint8Array`) and `queue` (`Int32Array`) private and unfrozen, exposing immutable `OctopusGrid` snapshots across boundaries.
- **Zero stored derived state**: `OctopusStepFrame` stores only `step`, `grid`, and `flashHistory`, deriving flash totals and synchronization dynamically via getters.
