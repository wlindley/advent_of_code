# 2022 Day 13 Part 2: Distress Signal

## Consumer Guide

- **Manifest**: `manifest` in `2022/day13/part2/index.ts` registers puzzle metadata, the 16-packet example (`140`), `solver`, and `DistressSignalPart2Visualizer`.
- **Domain API**: `2022/day13/part2/domain/index.ts` exports `solver`, `solvePart2`, `buildPart2Trace`, `classifyPacket`, `DividerTraceFrame`, `DIVIDER_FIRST`, `DIVIDER_SECOND`, and `DEFAULT_MAX_TRACE_STEPS` (`150`).
- **CLI Path**: `2022/day13/part2/domain/solver.ts` exports `solver: PuzzleSolver<SignalInput, number, DividerTraceFrame>` for `tools/aoc/cli.ts`.

## Maintainer Guide

- **O(N) Partitioning**: `solvePart2` classifies each packet into `'before-first'`, `'between'`, or `'after-second'` relative to `[[2]]` and `[[6]]`, deriving divider positions `(1 + beforeFirst)` and `(2 + beforeFirst + between)` without sorting.
- **No Stored Derived State**: `DividerTraceFrame` stores `(packetIndex, totalPackets, packet, firstComparison, secondComparison, bands)` and computes counts, divider indices, `decoderKey`, `decidingDivider`, `decidingComparison`, and `isComplete` dynamically via getters.
- **Bounded Visualization**: `buildPart2Trace` samples up to `DEFAULT_MAX_TRACE_STEPS` frames via `sampleTraceIndices` while preserving endpoints (`packetIndex === 1` and `packetIndex === totalPackets`). `DistressSignalPart2Visualizer` combines `PlaybackControls`, `DividerBandChart`, and `PacketComparePanel`.
