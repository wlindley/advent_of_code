# AoC 2024 Day 25 Part 1 — Code Chronicle

## User / Consumer Documentation
Counts unique lock/key pairs whose column pin and tooth heights fit within the available chamber height (`H - 2`) without colliding.

### Entrypoints
- **Domain solver (`./domain/solver.ts`)**:
  - `solvePart1(inventory)`: returns the number of fitting `(lock, key)` pairs.
  - `solver`: `PuzzleSolver<TumblerInventory, number, TumblerTraceFrame>` for CLI and manifest execution.
- **Site manifest (`./index.ts`)**: exports `manifest: PuzzlePartManifest` with `CodeChroniclePart1Visualizer` and `exampleAnswer: '3'`.

## Developer / Maintainer Documentation
- Delegates schematic parsing, contiguity validation, pair fit evaluation, and bounded trace generation to `../shared/`.
- `part1/domain/` contains zero React/DOM imports and zero default parameter values, preserving a strict one-way DAG (`shared/core` -> `day25/shared` -> `part1/domain` -> `part1/viz` -> `part1/index.ts`) with 100% V8 coverage.
