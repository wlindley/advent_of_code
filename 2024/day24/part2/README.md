# AoC 2024 Day 24 Part 2 — Crossed Wires

## User / Consumer Documentation
Identifies the 4 pairs of swapped gate output wires (`PART2_SWAP_COUNT = 4`) in a corrupted N-bit ripple-carry adder and returns the sorted, comma-joined list of the 8 swapped wire names.

### Entrypoints
- **Domain solver (`./domain/solver.ts`)**:
  - `PART2_SWAP_COUNT`: constant `4` specifying the expected number of swapped wire pairs.
  - `solvePart2(circuit)`: repairs the adder circuit and returns the sorted comma-joined wire names (`string`).
  - `solver`: `PuzzleSolver<LogicCircuit, string, CircuitSnapshot>` with `parse`, `solve`, and `trace` for CLI and manifest execution.
- **Visualizer (`./viz/CrossedWiresPart2Visualizer.tsx`)**:
  - `PART2_EXAMPLE_INPUT`: synthetic 17-gate 4-bit corrupted adder (`11 + 13 = 24`, initially `21`).
  - `CrossedWiresPart2Visualizer`: renders progressive repair snapshots via shared `CircuitVisualizer`.
- **Site manifest (`./index.ts`)**: exports `manifest: PuzzlePartManifest` with `CrossedWiresPart2Visualizer` and `exampleAnswer: 'c00,c02,g01,h03,p01,z00,z02,z03'`.

## Developer / Maintainer Documentation
- Delegates circuit parsing, ripple-carry slice backtracking (`repairAdder`), functional verification (`verifyAdderFunctionally`), and bounded repair trace generation (`buildRepairTrace`) to `../shared/`.
- `part2/domain/` is 100% pure TypeScript with zero React/DOM imports, zero nested functions, and zero default parameters, maintaining a strict one-way DAG (`shared/core` -> `day24/shared` -> `part2/domain` -> `part2/viz` -> `part2/index.ts`) with 100% V8 coverage.
