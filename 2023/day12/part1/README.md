# AoC 2023 Day 12 Part 1 — Hot Springs

## Consumer Guide

- **Domain entrypoint**: `2023/day12/part1/domain` exports `PART1_UNFOLD_FACTOR = 1` and `solver` (`PuzzleSolver<readonly SpringRecord[], bigint, HotSpringsTraceFrame>`).
- **Web manifest**: `2023/day12/part1/index.ts` exports `manifest` for auto-discovery by `site/registry.ts`.
- **Visualizer**: `HotSpringsPart1Visualizer` renders per-row telemetry badges, aligned pattern-vs-witness reconstruction, a `(G + 1) x (L + 1)` suffix-DP heatmap, and bounded row playback controls.

## Maintainer Architecture

- `domain/solver.ts` binds `PART1_UNFOLD_FACTOR = 1` into `createHotSpringsSolver` from `2023/day12/shared`, keeping Part 1 logic thin and zero-duplication with Part 2.
- `domain/solver.test.ts` verifies solver metadata, official example (`21n`), bounded trace sampling, `executeSolver`, and factory validation.
- `domain/solver.oracle.test.ts` cross-checks the suffix-DP and witness reconstructor against two independent oracles: a forward NFA automaton DP (including `5x` unfolded records) and exact `2^Q` wildcard enumeration.
