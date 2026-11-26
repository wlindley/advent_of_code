# `2024/day09/part1` — Disk Fragmenter (Part 1)

## Consumer Guide
Pure TypeScript solver and dual-scale interactive disk compaction visualizer for Advent of Code 2024 Day 9 Part 1.

- **CLI Execution**: `npm run aoc -- run 2024 9 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/blockCompaction.ts`: Implements `planBlockCompaction` (`O(F)` two-pointer extent compaction) and `BLOCK_COMPACTION_STRATEGY`.
- `domain/solver.ts`: Thin Part 1 facade delegating to `computeCompactedChecksum` and `sampleCompactionTrace`.
- `domain/solver.oracle.test.ts`: Cross-validates Part 1 against an independent expanded single-block swap oracle across 80 seeded PRNG disk maps.
- `viz/DiskPart1Visualizer.tsx`: Thin React wrapper passing `BLOCK_COMPACTION_STRATEGY` to `../../shared/viz/DiskCompactionVisualizer`.
