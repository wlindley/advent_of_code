# AoC 2024 Day 21 Part 1 — Keypad Conundrum

## User / Consumer Documentation
Computes the sum of door-code complexities (`shortest_human_press_length * numeric_code_value`) across a list of `\d+A` codes typed through `D = 2` intermediate directional robot keypads onto a 4×3 numeric keypad.

### Entrypoints
- **Domain solver (`./domain/solver.ts`)**:
  - `PART1_CONFIG`: `KeypadConfig(2)`.
  - `solvePart1(codes)`: returns exact `bigint` total complexity across `codes`.
  - `solver`: `PuzzleSolver<readonly DoorCode[], bigint, KeypadConundrumSnapshot>` for CLI and manifest execution.
- **Site manifest (`./index.ts`)**: exports `manifest: PuzzlePartManifest` with `KeypadConundrumPart1Visualizer` and `exampleAnswer: '126384'`.

## Developer / Maintainer Documentation
- Delegates all parsing, keypad geometry, `bigint` DP table construction, descending-depth chain reconstruction, and bounded trace generation to `../shared/`.
- `part1/domain/` contains zero React/DOM imports and zero default parameter values, maintaining a strict one-way DAG (`shared/core` -> `day21/shared` -> `part1/domain` -> `part1/viz` -> `part1/index.ts`) and 100% V8 branch coverage.
