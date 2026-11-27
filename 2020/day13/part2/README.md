# 2020 Day 13 Part 2 — Shuttle Search

## User / Consumer Guide

- **Manifest**: `manifest` in `part2/index.ts` registers `Shuttle Search` (`year: 2020`, `day: 13`, `part: 2`), the official 2-line example (`1068781`), `solver`, and `ShuttlePart2Visualizer`.
- **Solver**: `solver` in `part2/domain/solver.ts` wraps `ShuttleSolver(CONSECUTIVE_ALIGNMENT_POLICY)`.
  - `parse(raw)` validates the two-line timestamp and bus list into a `BusSchedule`.
  - `solve(schedule)` returns the earliest non-negative `bigint` timestamp satisfying `t + offset ≡ 0 (mod id)` for every active bus.
  - `trace(schedule, options)` emits bounded `CrtLockFrame[]` snapshots recording incremental modulus locking for step playback.
- **Visualizer**: `ShuttlePart2Visualizer` renders an interactive CRT modulus-locking chart with log-scaled modulus growth bars, KPI badges, and playback controls.

## Developer / Maintainer Guide

- Part 2 delegates all parsing, BigInt modular congruence construction, generalized CRT solving, trace sampling, and log-ratio projection to `2020/day13/shared/` and `shared/core`.
- `part2/domain/` is 100% pure TypeScript with zero React or DOM imports so CLI and Vitest runners execute it directly.
