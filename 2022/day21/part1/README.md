# 2022 Day 21 Part 1 — Monkey Math

## Consumer Guide

- `domain/index.ts` exports `solver: Required<PuzzleSolver<MonkeyRiddle, bigint, MonkeyTraceFrame>>` for CLI and browser execution.
- `index.ts` exports `manifest: PuzzlePartManifest` with the official example (`152`) and `MonkeyMathPart1Visualizer`.

## Maintainer Guide

- `domain/solver.ts` is a thin adapter delegating parsing, exact `root` evaluation, and bounded bottom-up tracing to `../../shared`.
- Unreachable monkeys outside `reachableBottomUp('root')` are skipped so off-path errors never affect `root`.
- `viz/MonkeyMathPart1Visualizer.tsx` delegates rendering and playback to `../../shared/viz/MonkeyMathVisualizer`.
