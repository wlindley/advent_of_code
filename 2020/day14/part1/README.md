# 2020 Day 14 Part 1 — Docking Data

## User / Consumer Guide

- **Manifest**: `manifest` in `part1/index.ts` registers `Docking Data` (`year: 2020`, `day: 14`, `part: 1`), the official example (`165`), `solver`, and `DockingPart1Visualizer`.
- **Solver**: `solver` in `part1/domain/solver.ts` wraps `new DockingSolver(DECODER_V1_POLICY)`.
  - `parse(raw)` validates `mask = ...` and `mem[addr] = val` lines into a `DockingProgram`.
  - `solve(program)` applies value bitmasks on each write and returns the `bigint` sum of non-zero memory cells.
  - `trace(program, options)` emits bounded `DockingTraceFrame[]` snapshots for step playback.
- **Visualizer**: `DockingPart1Visualizer` renders a 36-bit gate schematic (`BitmaskGateSvg`), step write preview and MRU non-zero memory ledger (`MemoryLedgerPanels`), KPI badges, and playback controls.

## Developer / Maintainer Guide

- Part 1 delegates all parsing, 36-bit BigInt bitmasking, sparse memory accounting, tracing, and gate projection to `2020/day14/shared/`.
- `part1/domain/` is 100% pure TypeScript with zero React or DOM imports so CLI and Vitest runners execute it directly.
