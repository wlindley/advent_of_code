# AoC 2024 Day 20 Part 1 — Race Condition

## User / Consumer Documentation
Counts valid single cheats of Manhattan duration `<= 2` that save at least `100` picoseconds on a rectangular `#` / `.` / `S` / `E` racetrack (or `>= 2` picoseconds on the official 15x15 example).

### Entrypoints
- **Domain solver (`./domain/solver.ts`)**:
  - `solver`: default `PuzzleSolver<Racetrack, number, RaceConditionSnapshot>` with `(maxDuration = 2, minSaving = 100)`.
  - `solvePart1(racetrack, minSaving)`: counts cheats saving `>= minSaving` for `K = 2`.
  - `createPart1Solver(minSaving)`: creates a parameterized `PuzzleSolver`.
- **Site manifest (`./index.ts`)**: exports `manifest: PuzzlePartManifest` with `RaceConditionPart1Visualizer`.

## Developer / Maintainer Documentation
- Delegates all parsing, dual BFS (`S` and `E`), diamond cheat scanning, and bounded trace generation to `../shared/`.
- `part1/domain/` contains zero React/DOM imports and zero default parameter values so CLI execution (`npm run aoc -- run 2024 20 1`) and 100% V8 branch coverage remain clean.
- `manifestSolver` and `RaceConditionPart1Visualizer` detect the exact official 15x15 example to select `PART1_EXAMPLE_CONFIG` (`minSaving = 2`), using `PART1_DEFAULT_CONFIG` (`minSaving = 100`) for all other inputs.
