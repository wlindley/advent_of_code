# 2023 Day 05 Part 2 — If You Give A Seed A Fertilizer (Seed Ranges)

## User / Consumer Guide

- **Entry point**: `manifest` in [`index.ts`](./index.ts) and pure `solver` in [`domain/solver.ts`](./domain/solver.ts).
- **CLI usage**: run via `tools/aoc/cli.ts` for `2023` day `5` part `2`.
- **Visualizer**: `AlmanacRangeVisualizer` animates each category map stage as a parallel-axis interval split & cubic-Bezier ribbon flow diagram, highlighting shifted bands (`var(--accent)`), identity bands (`var(--muted)`), and minimum-output ribbons (`var(--gold)`).

## Developer / Maintainer Guide

### Architecture & Invariants

1. **`domain/intervals.ts`**:
   - `parseSeedRanges(seeds)` validates non-empty even-length `(start, length)` pairs (`start >= 0n`, `length >= 1n`) into a coalesced `IntervalUnion`.
   - `FlowRibbon` stores only `(source, matchedRule)` and validates `source ⊆ matchedRule.source` when matched; `delta`, `destination`, and `isIdentity` are computed dynamically.
   - `splitUnionByMap` performs a single O(I + R) two-pointer sweep across sorted disjoint intervals and sorted `RangeRule`s. `ruleIdx` advances **only** when `matchEnd === rule.source.end` so multiple disjoint intervals inside a wide rule all match it.
2. **`domain/trace.ts`**:
   - `IntervalStageFrame` stores `(stageIndex, totalStages, sourceCategory, destCategory, ribbons)` and derives `input`, `output`, `minOutput`, `matchedRibbonCount`, and `identityRibbonCount`.
   - `findLowestRangeLocation` composes `mapIntervalUnion` across all stages and returns `current.intervals[0].start`.
   - `traceAlmanacRanges` bounds trace output via `validateMaxSteps` and `sampleTraceIndices` (default `DEFAULT_MAX_TRACE_STEPS = 200`).
3. **`domain/solver.ts` & `viz/AlmanacRangeVisualizer.tsx`**:
   - `solver` binds `parseAlmanac`, `findLowestRangeLocation`, and `traceAlmanacRanges` in a frozen `PuzzleSolver`.
   - `AlmanacRangeVisualizer` uses exact `bigint` normalization, enforces `MIN_BAND_PX = 2.5` for thin intervals, and caps per-stage SVG ribbons at `MAX_SVG_RIBBONS_PER_STAGE = 240` while preserving minimum-output ribbons.
