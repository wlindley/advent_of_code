# AoC 2024 Day 23 Part 2 — LAN Party

## User / Consumer Documentation
Finds the maximum clique (largest mutually interconnected set of computers) in an undirected LAN graph and formats its sorted computer names as a comma-separated password.

### Entrypoints
- **Domain solver (`./domain/solver.ts`)**:
  - `solvePart2(graph)`: returns the comma-separated sorted password of the maximum clique in `graph`.
  - `solver`: `PuzzleSolver<LanGraph, string, LanPartySnapshot>` for CLI and manifest execution.
- **Site manifest (`./index.ts`)**: exports `manifest: PuzzlePartManifest` with `LanPartyPart2Visualizer` and `exampleAnswer: 'co,de,ka,ta'`.

## Developer / Maintainer Documentation
- Delegates graph parsing, pivoted Bron–Kerbosch maximum-clique search, and bounded snapshot trace generation to `../shared/`.
- `part2/domain/` contains zero React/DOM imports and zero default parameter values, preserving a strict one-way DAG (`shared/core` -> `day23/shared` -> `part2/domain` -> `part2/viz` -> `part2/index.ts`) with 100% V8 coverage.
