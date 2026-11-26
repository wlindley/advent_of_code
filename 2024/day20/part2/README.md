# AoC 2024 Day 20 Part 2 — Race Condition

## User / Consumer Documentation
Counts valid single cheats of Manhattan duration `<= 20` that save at least `100` picoseconds on a rectangular `#` / `.` / `S` / `E` racetrack (or `>= 50` picoseconds on the official 15x15 example).

### Entrypoints
- **Domain solver (`./domain/solver.ts`)**:
  - `solver`: default `PuzzleSolver<Racetrack, number, RaceConditionSnapshot>` with `(maxDuration = 20, minSaving = 100)`.
  - `solvePart2(racetrack, minSaving)`: counts cheats saving `>= minSaving` for `K = 20`.
  - `createPart2Solver(minSaving)`: creates a parameterized `PuzzleSolver`.
- **Site manifest (`./index.ts`)**: exports `manifest: PuzzlePartManifest` with `RaceConditionPart2Visualizer`.

## Developer / Maintainer Documentation
- Delegates all parsing, dual BFS (`S` and `E`), diamond cheat scanning (`K = 20`), and bounded trace generation to `../shared/`.
- `part2/domain/` contains zero React/DOM imports, zero imports from `../part1/`, and zero default parameter values so CLI execution (`npm run aoc -- run 2024 20 2`) and 100% V8 branch coverage remain clean.
- `manifestSolver` and `RaceConditionPart2Visualizer` detect the exact official 15x15 example to select `PART2_EXAMPLE_CONFIG` (`minSaving = 50`), using `PART2_DEFAULT_CONFIG` (`minSaving = 100`) for all other inputs.
