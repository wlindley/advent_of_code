# 2021 Day 16 Part 1 — Packet Decoder

Decodes a hexadecimal BITS packet hierarchy and sums the 3-bit version field across the root packet and all nested sub-packets.

## Consumer Usage

- **CLI / Domain Solver (`part1/domain/solver.ts`)**: Exports `solver = new PacketSolver(VERSION_SUM_POLICY)` implementing `parse`, `analyze`, `solve`, `trace`, and `formatAnswer`.
- **Site Manifest (`part1/index.ts`)**: Exports `manifest: PuzzlePartManifest` with the nested-operator example (`31`) and `Part1Visualizer`.

## Maintainer Notes

- **Domain Boundary**: `part1/domain/` delegates exclusively to `../../shared/` with zero React or DOM imports.
- **Visualization (`part1/viz/Part1Visualizer.tsx`)**: Thin wrapper rendering `PacketVisualizer`, animating bitstream header/payload discovery and post-order version-sum accumulation.
