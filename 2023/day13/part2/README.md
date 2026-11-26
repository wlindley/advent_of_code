# AoC 2023 Day 13 Part 2 — Point of Incidence

## Consumer Guide

- **Domain entrypoint**: `2023/day13/part2/domain` exports `PART2_TARGET_SMUDGES = 1` and `solver` (`PuzzleSolver<readonly MirrorPattern[], number, IncidenceTraceFrame>`).
- **Web manifest**: `2023/day13/part2/index.ts` exports `manifest` for auto-discovery by `site/registry.ts`.
- **Visualizer**: `IncidencePart2Visualizer` renders pattern telemetry badges (including repaired smudge coordinates), a sampled pattern selector strip, an interactive SVG mirror grid (gold reflection axis, smudge pair highlights, dimmed overhang cells, hover partner tracing), and bounded playback controls.

## Maintainer Architecture

- `domain/solver.ts` binds `PART2_TARGET_SMUDGES = 1` into `createIncidenceSolver` from `2023/day13/shared`, sharing bitmask encoding, mismatch extraction, and bounded trace sampling with Part 1 while keeping Part 2 completely decoupled.
- `domain/solver.test.ts` verifies `PART2_TARGET_SMUDGES`, official example (`400`), exact smudge coordinates and bounded trace sampling, `executeSolver` with a deterministic `Clock` fake, and `RangeError`/`Error` rejections for empty, zero-axis, and ambiguous patterns.
- `domain/solver.oracle.test.ts` cross-checks the BigInt bitmask solver against an independent literal single-cell-flip oracle (`bruteForceSmudgeAxis`, deduplicating axes not in `originalAxes` by axis identity) across the official example, edge axes, overhang-preserving and `A0`-destroying repairs, a `6x66` wide grid (>53-bit & >64-bit), and 60 seeded synthetic patterns.
