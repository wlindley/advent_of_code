# 2022 Day 13 Part 1: Distress Signal

## Consumer Guide

- **Manifest**: `manifest` in `2022/day13/part1/index.ts` registers puzzle metadata, the 8-pair example (`13`), `solver`, and `DistressSignalPart1Visualizer`.
- **Domain API**: `2022/day13/part1/domain/index.ts` exports `solver`, `solvePart1`, `buildPart1Trace`, `PairTraceFrame`, and `DEFAULT_MAX_TRACE_STEPS` (`150`).
- **CLI Path**: `2022/day13/part1/domain/solver.ts` exports `solver: PuzzleSolver<SignalInput, number, PairTraceFrame>` for `tools/aoc/cli.ts`.

## Maintainer Guide

- **No Stored Derived State**: `PairTraceFrame` stores `(pairIndex, totalPairs, pair, comparison, outcomes)` and derives `order`, `isRightOrder`, `rightOrderCount`, `rightOrderIndexSum`, and `isComplete` via getters.
- **Bounded Visualization**: `buildPart1Trace` samples up to `DEFAULT_MAX_TRACE_STEPS` frames via `sampleTraceIndices` while preserving endpoints (`pairIndex === 1` and `pairIndex === totalPairs`).
- **Visualization**: `DistressSignalPart1Visualizer` combines `PlaybackControls`, `PairIndexGrid`, and the shared `PacketComparePanel`.
