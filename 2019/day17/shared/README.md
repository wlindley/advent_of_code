# Day 17 Shared Scaffold Kernel

Pure TypeScript Intcode ASCII camera decoding, scaffold grid geometry, greedy path tracing, bounded 3-subroutine compression, dust collection execution, and batched SVG layout shared across Advent of Code 2019 Day 17 parts.

## Consumer Guide

- `ScaffoldSolver`: `PuzzleSolver` implementation parameterized by `ALIGNMENT_PARAMETERS_POLICY` (Part 1 alignment parameter sum) or `DUST_COLLECTION_POLICY` (Part 2 compressed routine sweep and dust total).
- `executeScaffold(program, policy, limits?)` / `traceScaffold(program, policy, maxSteps?, limits?)`: Runs the solver policy directly or samples up to `maxSteps` (`120` by default) `ScaffoldTraceFrame` snapshots.
- `buildScaffoldSvgLayout(frame, policy)`: Batches revealed scaffold cells, intersections, directional robot marker, and swept path polyline into compact SVG primitives.

## Maintainer Architecture

Strict one-way DAG (zero `viz/` imports in `index.ts`):
- `asciiIo.ts` -> `2019/shared/intcode` (`AsciiIoChannel` with O(1) cursor draining and dust separation).
- `scaffoldMap.ts` -> `ScaffoldMap` (private `Uint8Array`, dynamic getters for `robot`, `scaffoldCount`, `intersections`, `alignmentParameterSum`).
- `scaffoldPath.ts` -> `scaffoldMap.ts` (greedy straight-across-intersections walk with `(y * width + x) * 4 + dirIdx` cycle guard).
- `routineCompressor.ts` -> `RoutinePlan` and exact bounded DFS + `failed` memoization (`compressPath`).
- `scaffoldRunner.ts` -> `2019/shared/intcode`, `asciiIo.ts`, `scaffoldMap.ts`, `routineCompressor.ts`.
- `scaffoldSolver.ts` -> `shared/core`, `2019/shared/intcode`, `scaffoldRunner.ts`, `scaffoldPath.ts`, `routineCompressor.ts`.
- `vizLayout.ts` -> `scaffoldMap.ts`, `scaffoldSolver.ts`.
- `viz/ScaffoldVisualizer.tsx` -> React playback UI consuming the shared barrel and `shared/viz` `PlaybackControls`.
