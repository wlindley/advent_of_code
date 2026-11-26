# AoC 2024 Day 21 Part 2 — Keypad Conundrum

## User / Consumer Documentation
Computes the sum of door-code complexities (`shortest_human_press_length * numeric_code_value`) across a list of `\d+A` codes typed through `D = 25` intermediate directional robot keypads onto a 4×3 numeric keypad.

### Entrypoints
- **Domain solver (`./domain/solver.ts`)**:
  - `PART2_CONFIG`: `KeypadConfig(25)`.
  - `solvePart2(codes)`: returns exact `bigint` total complexity across `codes`.
  - `solver`: `PuzzleSolver<readonly DoorCode[], bigint, KeypadConundrumSnapshot>` for CLI and manifest execution.
- **Site manifest (`./index.ts`)**: exports `manifest: PuzzlePartManifest` with `KeypadConundrumPart2Visualizer` and `exampleAnswer: '154115708116294'`.

## Developer / Maintainer Documentation
- Delegates all parsing, keypad geometry, `bigint` DP table construction, bounded trace generation, and summary rendering to `../shared/` (omitting full layer expansion above 512 chars).
- `part2/domain/` contains zero React/DOM imports and zero default parameter values, maintaining a strict one-way DAG (`shared/core` -> `day21/shared` -> `part2/domain` -> `part2/viz` -> `part2/index.ts`) and 100% V8 branch coverage.
