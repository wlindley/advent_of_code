# 2021 Day 4 Part 1 — Giant Squid

Determines the first 5x5 Bingo board to complete any row or column and computes its score (`unmarkedSum * winningDraw`).

## Consumer Interface

- `domain/index.ts` / `domain/solver.ts`: exports `solver` (`PuzzleSolver<BingoGame, bigint, BingoTraceFrame>`).
- `viz/Part1Visualizer.tsx`: binds `solver` and `FIRST_WINNER_POLICY` to `BingoVisualizer`.
- `index.ts`: exports `manifest: PuzzlePartManifest`.

## Maintainer Architecture

- **Zero-Logic Wrapper**: `part1/domain/solver.ts` delegates directly to `createBingoSolver(FIRST_WINNER_POLICY)` in `2021/day04/shared`.
- **Bounded Visualization**: `BingoVisualizer` caps trace frames at `120` and visible board cards at `6` while preserving a full status strip across all boards.
