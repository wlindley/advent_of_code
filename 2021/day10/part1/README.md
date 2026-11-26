# 2021 Day 10 Part 1 — Syntax Scoring

## Consumer Guide

- **Solver**: `export const solver` in `domain/solver.ts` (`SyntaxScoringSolver(CORRUPTION_SCORE_POLICY)`), returning a `bigint` total syntax error score (`26397n` on the 10-line example).
- **Manifest**: `export const manifest` in `index.ts` registers metadata, the 10-line example, `solver`, and `Part1Visualizer`.
- **Visualizer**: `Part1Visualizer` delegates to `SyntaxScoringVisualizer`, stepping line-by-line through the bracket scan, live opener stack, clash pointer, and 4-column illegal closer tally.

## Maintainer Guide

- `domain/` contains zero DOM/React imports and injects `CORRUPTION_SCORE_POLICY` into `SyntaxScoringSolver`.
- `Part1Visualizer` is a thin presentation wrapper over `2021/day10/shared/viz/SyntaxScoringVisualizer`.
- No domain rules live inside `part1/`; all classification, scoring, and trace sampling reside in `2021/day10/shared/`.
