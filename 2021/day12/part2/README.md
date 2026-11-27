# 2021 Day 12 Part 2 — Passage Pathing

## Consumer Guide

- **Domain entrypoint** (`2021/day12/part2/domain`): exports `solver`, a `CavePathSolver` configured with `SINGLE_SMALL_REVISIT_POLICY` returning exact `bigint` path counts.
- **Manifest** (`2021/day12/part2`): exports `manifest: PuzzlePartManifest` with the official small example (`exampleAnswer: '36'`), `solver`, and `Part2Visualizer`.
- **CLI usage**: `npm run aoc -- run 2021 12 2`

## Maintainer Notes

- `part2/domain/solver.ts` delegates parsing, big-cave contraction, BigInt bitmask + revisit-budget DP, and bounded trace capture to `2021/day12/shared` (`SINGLE_SMALL_REVISIT_POLICY`).
- `part2/viz/Part2Visualizer.tsx` is a thin wrapper passing `solver` to `CaveVisualizer`, keeping presentation decoupled from domain logic.
- `part2/domain/solver.test.ts` covers official AoC examples, Part 2 topology edge cases, full and bounded traces, input/option validation, and a 30-case seeded raw-string DFS differential oracle.
