# 2020 Day 14 Part 2 — Docking Data

## User / Consumer Guide

- **Manifest**: `manifest` in `part2/index.ts` registers `Docking Data` (`year: 2020`, `day: 14`, `part: 2`), the official example (`208`), `solver`, and `DockingPart2Visualizer`.
- **Solver**: `solver` in `part2/domain/solver.ts` wraps `new DockingSolver(DECODER_V2_POLICY)`.
  - `parse(raw)` validates `mask = ...` and `mem[addr] = val` lines into a `DockingProgram`.
  - `solve(program)` expands floating `X` bits on each target address (`<= MAX_FLOATING_BITS`), writes the raw value to every expanded address, and returns the `bigint` sum of non-zero cells.
  - `trace(program, options)` emits bounded `DockingTraceFrame[]` snapshots with capped `writePreview` records (`MAX_PREVIEW_WRITES`) for step playback.
- **Visualizer**: `DockingPart2Visualizer` renders a 36-bit gate schematic (`BitmaskGateSvg`), step write preview and MRU non-zero memory ledger (`MemoryLedgerPanels`), KPI badges, and playback controls.

## Developer / Maintainer Guide

- Part 2 delegates all parsing, 36-bit BigInt address expansion, sparse memory accounting, tracing, and gate projection to `2020/day14/shared/`.
- `part2/domain/` is 100% pure TypeScript with zero React or DOM imports so CLI and Vitest runners execute it directly.
