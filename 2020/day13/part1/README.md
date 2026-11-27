# 2020 Day 13 Part 1 — Shuttle Search

## User / Consumer Guide

- **Manifest**: `manifest` in `part1/index.ts` registers `Shuttle Search` (`year: 2020`, `day: 13`, `part: 1`), the official 2-line example (`295`), `solver`, and `ShuttlePart1Visualizer`.
- **Solver**: `solver` in `part1/domain/solver.ts` wraps `ShuttleSolver(EARLIEST_BUS_POLICY)`.
  - `parse(raw)` validates the two-line timestamp and bus list into a `BusSchedule`.
  - `solve(schedule)` returns the `bigint` product `bus.id * waitMinutes` for the earliest departing bus.
  - `trace(schedule, options)` emits bounded `EarliestBusFrame[]` snapshots for step playback.
- **Visualizer**: `ShuttlePart1Visualizer` renders an interactive departure wait timetable with per-bus wait bars, a gold best-wait guide line, KPI badges, and playback controls.

## Developer / Maintainer Guide

- Part 1 delegates all parsing, BigInt modular wait arithmetic, policy tracing, and ratio projection to `2020/day13/shared/`.
- `part1/domain/` is 100% pure TypeScript with zero React or DOM imports so CLI and Vitest runners execute it directly.
