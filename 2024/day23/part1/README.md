# AoC 2024 Day 23 Part 1 — LAN Party

## User / Consumer Documentation
Counts canonical interconnected 3-computer cliques (triangles) in an undirected LAN graph that contain at least one computer whose name starts with `'t'`.

### Entrypoints
- **Domain solver (`./domain/solver.ts`)**:
  - `PART1_PREFIX`: `'t'`.
  - `solvePart1(graph)`: returns the count of `'t*'`-containing triangles in `graph`.
  - `solver`: `PuzzleSolver<LanGraph, number, LanPartySnapshot>` for CLI and manifest execution.
- **Site manifest (`./index.ts`)**: exports `manifest: PuzzlePartManifest` with `LanPartyPart1Visualizer` and `exampleAnswer: '7'`.

## Developer / Maintainer Documentation
- Delegates graph parsing, sorted-adjacency triangle enumeration (`u < v < w`), and bounded snapshot trace generation to `../shared/`.
- `part1/domain/` contains zero React/DOM imports and zero default parameter values, preserving a strict one-way DAG (`shared/core` -> `day23/shared` -> `part1/domain` -> `part1/viz` -> `part1/index.ts`) with 100% V8 coverage.
