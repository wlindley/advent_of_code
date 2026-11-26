# AoC 2024 Day 24 Part 1 — Crossed Wires

## User / Consumer Documentation
Simulates a combinational boolean gate network (`AND`, `OR`, `XOR`) from initial wire states and assembles the resulting `zNN` output bits into an unsigned `bigint`.

### Entrypoints
- **Domain solver (`./domain/solver.ts`)**:
  - `solvePart1(circuit)`: topologically evaluates `circuit` and returns `zValue` (`bigint`).
  - `solver`: `PuzzleSolver<LogicCircuit, bigint, CircuitSnapshot>` for CLI and manifest execution.
- **Site manifest (`./index.ts`)**: exports `manifest: PuzzlePartManifest` with `CrossedWiresPart1Visualizer` and `exampleAnswer: '2024'`.

## Developer / Maintainer Documentation
- Delegates circuit parsing, `DirectedGraph.topologicalOrder()` evaluation, `BigInt` bus assembly, and bounded trace generation to `../shared/`.
- `part1/domain/` contains zero React/DOM imports and zero default parameter values, preserving a strict one-way DAG (`shared/core` -> `day24/shared` -> `part1/domain` -> `part1/viz` -> `part1/index.ts`) with 100% V8 coverage.
