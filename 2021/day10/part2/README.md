# 2021 Day 10 Part 2 — Syntax Scoring

## Consumer Guide

- **Solver**: `export const solver` in `domain/solver.ts` (`SyntaxScoringSolver(AUTOCOMPLETE_MEDIAN_POLICY)`), returning a `bigint` median autocomplete score (`288957n` on the 10-line example).
- **Manifest**: `export const manifest` in `index.ts` registers metadata, the 10-line example, `solver`, and `Part2Visualizer`.
- **Visualizer**: `Part2Visualizer` delegates to `SyntaxScoringVisualizer`, stepping through incomplete lines, the live opener stack, base-5 completion folding, and sorted median ranking.

## Maintainer Guide

- `domain/` contains zero DOM/React imports and injects `AUTOCOMPLETE_MEDIAN_POLICY` into `SyntaxScoringSolver`.
- `Part2Visualizer` is a thin presentation wrapper over `2021/day10/shared/viz/SyntaxScoringVisualizer`.
- No domain rules live inside `part2/`; all classification, BigInt base-5 scoring, and trace sampling reside in `2021/day10/shared/`.
