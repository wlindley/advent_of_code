# Day 13 Shared Arcade Cabinet Kernel

Pure TypeScript Intcode arcade execution, trace sampling, and SVG layout modules shared across Advent of Code 2019 Day 13 parts.

## Consumer Guide

- `ArcadeSolver`: `PuzzleSolver` implementation parameterized by `BLOCK_COUNT_POLICY` (Part 1 block count, unpatched memory) or `FREE_PLAY_SCORE_POLICY` (Part 2 free-play score, memory address `0` patched to `2`).
- `executeArcade(program, policy, limits?)`: Runs the Intcode arcade cabinet and returns an `ArcadeReport` with dynamically derived `blockCount` and `bounds`.
- `traceArcade(program, policy, maxSteps?, limits?)`: Uniformly samples up to `maxSteps` (`120` by default) `ArcadeTraceFrame` snapshots across `'draw'` or `'play'` phases.
- `buildArcadeSvgLayout(frame)`: Produces batched SVG paths (`wallPath`, 5 rainbow `blockBandPaths`, `paddlePath`), `ballCenter`, `ballTrailPoints`, and HUD metrics.

## Maintainer Architecture

Module DAG (strictly acyclic, zero `viz/` imports in `index.ts`):
- `arcadeIo.ts` -> `2019/shared/intcode` (`IoChannel` with O(1) cursor-draining `takeOutput()`).
- `arcadeModels.ts` -> pure value types, `ScreenBounds`, `ArcadeReport` (dynamic `blockCount` and `bounds` getters, zero stored derived state), `ArcadePolicy`, and `chooseJoystickTilt`.
- `arcadeExecution.ts` -> `2019/shared/intcode`, `arcadeIo.ts`, `arcadeModels.ts` (run-first Intcode loop pushing joystick input via `machine.pushInput`).
- `arcadeSolver.ts` -> `shared/core`, `2019/shared/intcode`, `arcadeExecution.ts`, `arcadeModels.ts` (memory-bounded single-map replay sampler across draw and play phases).
- `vizLayout.ts` -> `arcadeModels.ts` (batched SVG geometry in <= 9 primitives).
- `viz/ArcadeCabinetVisualizer.tsx` -> React UI consuming the shared barrel and `shared/viz` `PlaybackControls`.
