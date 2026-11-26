# 2022 Day 21 Part 2 — Monkey Math

## Consumer Guide

- `domain/index.ts` exports `solver: Required<PuzzleSolver<MonkeyRiddle, bigint, MonkeyTraceFrame>>` for CLI and browser execution.
- `index.ts` exports `manifest: PuzzlePartManifest` with the official example (`301`) and `MonkeyMathPart2Visualizer`.

## Maintainer Guide

- `domain/solver.ts` is a thin adapter delegating parsing, equality solving (`root` left = right for `humn`), and bounded inversion tracing to `../../shared`.
- Single-occurrence `humn` inputs use top-down exact rational inversion (`invertSinglePath`); multi-path linear DAGs fall back to `AffineExpr` solving (`solveMultiPathAffine`).
- Unreachable monkeys outside `reachableBottomUp('root')` are skipped, and `humn`'s dummy literal is never evaluated during inversion.
- `viz/MonkeyMathPart2Visualizer.tsx` delegates rendering and playback to `../../shared/viz/MonkeyMathVisualizer`.
