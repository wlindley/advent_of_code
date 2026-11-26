# AoC 2023 Day 13 Part 1 — Point of Incidence

## Consumer Guide

- **Domain entrypoint**: `2023/day13/part1/domain` exports `PART1_TARGET_SMUDGES = 0` and `solver` (`PuzzleSolver<readonly MirrorPattern[], number, IncidenceTraceFrame>`).
- **Web manifest**: `2023/day13/part1/index.ts` exports `manifest` for auto-discovery by `site/registry.ts`.
- **Visualizer**: `IncidencePart1Visualizer` renders pattern telemetry badges, a sampled pattern selector strip, an interactive SVG mirror grid (gold reflection axis, dimmed overhang cells, hover partner tracing), and bounded playback controls.

## Maintainer Architecture

- `domain/solver.ts` binds `PART1_TARGET_SMUDGES = 0` into `createIncidenceSolver` from `2023/day13/shared`, keeping Part 1 logic minimal and reusable for Part 2.
- `domain/solver.test.ts` verifies `PART1_TARGET_SMUDGES`, official example (`405`), bounded trace sampling, `executeSolver`, and invalid input rejection.
- `domain/solver.oracle.test.ts` cross-checks BigInt mask reflection detection against an independent raw-character cell-by-cell scanner across official examples, edge axes, wide grids (>64 cols/rows), and 64 seeded synthetic patterns.
