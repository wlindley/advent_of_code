# 2021 Day 12 Part 1 — Passage Pathing

## Consumer Guide

- **Domain entrypoint** (`2021/day12/part1/domain`): exports `solver`, a `CavePathSolver` configured with `NO_REVISIT_POLICY` returning exact `bigint` path counts.
- **Manifest** (`2021/day12/part1`): exports `manifest: PuzzlePartManifest` with the official small example (`exampleAnswer: '10'`), `solver`, and `Part1Visualizer`.
- **CLI usage**: `npx tsx tools/aoc/cli.ts solve 2021/day12/part1 <input-file>`

## Maintainer Notes

- `part1/domain/solver.ts` delegates parsing, big-cave contraction, BigInt bitmask DP, and bounded trace capture to `2021/day12/shared` (`NO_REVISIT_POLICY`).
- `part1/viz/Part1Visualizer.tsx` is a thin wrapper passing `solver` to `CaveVisualizer`, keeping presentation decoupled from domain logic.
- `part1/domain/solver.oracle.test.ts` cross-checks the contracted BigInt DP solver against an independent raw-graph string-backtracking DFS oracle across official examples, degree-1 big-cave edge cases, and 35 seeded random cave systems.
