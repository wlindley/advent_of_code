# 2020 Day 12 Part 1 — Rain Risk

## User / Consumer Guide

- **Manifest**: `manifest` in `part1/index.ts` registers `Rain Risk` (`year: 2020`, `day: 12`, `part: 1`), the official 5-line example (`25`), `solver`, and `RainRiskPart1Visualizer`.
- **Solver**: `solver` in `part1/domain/solver.ts` wraps `RainRiskSolver(HEADING_NAVIGATION_RULE)`.
  - `parse(raw)` returns validated `NavigationInstruction[]`.
  - `solve(instructions)` returns the final `bigint` Manhattan distance from `(0, 0)`.
  - `trace(instructions, options)` returns bounded `NavigationTraceFrame[]` snapshots for playback.
- **Visualizer**: `RainRiskPart1Visualizer` renders an interactive nautical course chart with full-course ghost, active ship wake, Manhattan L-legs, rotated ship chevron, and a heading compass inset.

## Developer / Maintainer Guide

- Part 1 delegates all domain modeling, BigInt arithmetic, turn normalization, tracing, and projection to `2020/day12/shared/`.
- `part1/domain/` remains pure TypeScript with zero React/DOM dependencies so CLI and test runners execute it directly.
