# 2021 Day 16 Part 2 — Packet Decoder

Decodes a hexadecimal BITS packet hierarchy and evaluates the nested BigInt expression tree across sum, product, minimum, maximum, and pairwise comparison operators.

## Consumer Usage

- **CLI / Domain Solver (`part2/domain/solver.ts`)**: Exports `solver = new PacketSolver(EVALUATE_EXPRESSION_POLICY)` implementing `parse`, `analyze`, `solve`, `trace`, and `formatAnswer`.
- **Site Manifest (`part2/index.ts`)**: Exports `manifest: PuzzlePartManifest` with the nested-comparison example (`1`) and `Part2Visualizer`.

## Maintainer Notes

- **Domain Boundary**: `part2/domain/` delegates exclusively to `../../shared/` with zero React or DOM imports.
- **Visualization (`part2/viz/Part2Visualizer.tsx`)**: Thin wrapper rendering `PacketVisualizer`, animating bitstream header/payload discovery and post-order BigInt expression reduction.
