# AoC 2023 Day 12 Part 2 — Hot Springs

## Consumer Guide

- **Domain entrypoint**: `2023/day12/part2/domain` exports `PART2_UNFOLD_FACTOR = 5` and `solver` (`PuzzleSolver<readonly SpringRecord[], bigint, HotSpringsTraceFrame>`).
- **Web manifest**: `2023/day12/part2/index.ts` exports `manifest` for auto-discovery by `site/registry.ts`.
- **Visualizer**: `HotSpringsPart2Visualizer` renders per-row telemetry badges (including `×5` unfold indicator and exact `BigInt` counts), aligned pattern-vs-witness reconstruction, a `(G + 1) x (L + 1)` suffix-DP heatmap, and bounded row playback controls.

## Maintainer Architecture

- `domain/solver.ts` binds `PART2_UNFOLD_FACTOR = 5` into `createHotSpringsSolver` from `2023/day12/shared`, sharing the suffix-DP engine, unfolding logic, and bounded trace sampler with zero code duplication.
- `domain/solver.test.ts` verifies `PART2_UNFOLD_FACTOR = 5`, solver immutability, official 5x unfolded counts (`525152n`), `.# 1` unfolding semantics, bounded/invalid `maxSteps` trace contracts, parse error boundaries, `executeSolver` with a hand-written fake `Clock`, and exact `BigInt` precision above `Number.MAX_SAFE_INTEGER`.
- `domain/solver.oracle.test.ts` cross-checks the 5x unfolded suffix-DP solver and witness reconstructor against an independent `TopDownMemoOracle` (`(pos, groupIdx, currentRun)`), closed-form `binomial(L' - sum(G') + 1, |G'|)` for `?`-only rows, cross-boundary `#` bridging and impossible `0n` cases, and seeded PRNG records.
