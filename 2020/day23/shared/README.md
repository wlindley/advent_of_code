# 2020 Day 23 Shared Domain

## User Guide
Pure TypeScript domain package for AoC 2020 Day 23 (*Crab Cups*).
Instantiate `new CrabCupsSolver(STANDARD_CUPS_POLICY)` for Part 1 or
`new CrabCupsSolver(MILLION_CUPS_POLICY)` for Part 2 via `./index.ts`.

## Developer Architecture
- `model.ts`: Strict digit-string parser (`parseCupLabels`) and immutable `CupRingSpec` validation (`labels.length >= 4`, distinct integers `1..N`).
- `ring.ts`: Unfrozen `Int32Array`-backed `CupRing` (`next[cup]`) with O(1) tight-loop `advance(moves)` supporting `N >= 4` (including `dest === cur` at `N = 4`).
- `policies.ts`: Polymorphic `CrabCupsPolicy` (`STANDARD_CUPS_POLICY`, `MILLION_CUPS_POLICY`).
- `trace.ts`, `engine.ts`: Single-pass `simulateCrabCups` and uniformly sampled `simulateCrabCupsTrace` producing `CrabCupsTraceFrame` snapshots with dynamic getters (no stored derived state).
- `projection.ts`: Pure-TS SVG projection for circular full-ring mode (`<= 20` cups) and dual 12-cup local-window ribbon mode (`> 20` cups).
- `solver.ts`: `CrabCupsSolver` implementing `PuzzleSolver`.
