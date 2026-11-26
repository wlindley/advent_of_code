# AoC 2023 Day 15 Part 1 — Lens Library

## Consumer Guide

- **Domain entrypoint**: `2023/day15/part1/domain` exports `solver` (`PuzzleSolver<readonly string[], number, HashSequenceFrame>`), `solveHashSum`, `traceHashSequence`, `validateBucketCounts`, `HashSequenceFrame`, and `DEFAULT_MAX_TRACE_STEPS = 120`.
- **Web manifest**: `2023/day15/part1/index.ts` exports `manifest` for auto-discovery by `site/registry.ts`.
- **Visualizer**: `LensLibraryPart1Visualizer` displays step telemetry badges, `HashPipelineRibbon` for the active token, `HashBucketHeatmap` (16×16 grid of all 256 buckets scaled to global peak), and `PlaybackControls`.

## Maintainer Architecture

- `domain/solver.ts`: Parses comma-separated steps with `parseInitSequence` and sums `hashAscii(token)` in one linear pass.
- `domain/trace.ts`: Uses `sampleTraceIndices(steps.length, limit)` and a local `Uint32Array(256)` histogram to build at most `DEFAULT_MAX_TRACE_STEPS` frozen `HashSequenceFrame` snapshots with dynamically computed `processedCount`, `tokenHash`, `charTransitions`, `runningSum`, `occupiedBuckets`, and `maxBucketCount`.
- `domain/trace.test.ts` & `domain/solver.test.ts`: Covers constructor invariants, trace sampling/caps, `executeSolver` with a deterministic fake `Clock`, and a BigInt base-17 polynomial differential oracle across 120 seeded random sequences.
