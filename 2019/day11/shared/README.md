# Day 11 Shared Hull-Painting Robot Kernel

Pure TypeScript simulation, OCR, and SVG geometry layout modules shared across Advent of Code 2019 Day 11 parts.

## Consumer Guide

- `PaintingRobotSolver`: `PuzzleSolver` implementation parameterized by `PAINTED_COUNT_POLICY` (Part 1, starts on black `0`) or `REGISTRATION_ID_POLICY` (Part 2, starts on white `1`).
- `executePaintingRobot(program, startPanelColor, limits?)`: Runs the Intcode brain in lockstep with the hull camera and returns a `PaintingReport`.
- `tracePaintingRobot(program, startPanelColor, maxSteps?, limits?)`: Uniformly samples up to `maxSteps` (`120` by default) `HullTraceFrame` snapshots.
- `decodeHullRegistration(whitePanels)` / `tryDecodeHullRegistration(whitePanels)`: Decodes 5×6 canonical AoC letters from white hull coordinates.
- `buildHullSvgLayout(frame)`: Produces 4-layer batched `<path>` strings, recent `<polyline>` trail, robot heading `<polygon>`, and dynamic HUD metrics.

## Maintainer Architecture

Module DAG (strictly acyclic, zero `viz/` imports in `index.ts`):
- `robotIo.ts` → `2019/shared/intcode` (`IoChannel` with O(1) cursor-draining `takeOutput()`).
- `robotModels.ts` → pure value types, `HullBounds`, `PaintingReport` (getters for `paintedCount` and `whitePanels` with zero stored derived state), and `PaintingPolicy`.
- `bitmapFont.ts` → `robotModels.ts` (20 canonical 30-bit 5×6 glyphs with `minX` / `minX - 1` origin fallback for leading centered `I`).
- `robotRunner.ts` → `2019/shared/intcode`, `shared/core`, `robotIo.ts`, `robotModels.ts`, `bitmapFont.ts` (run-first Intcode loop pushing camera input only via `machine.pushInput`).
- `vizLayout.ts` → `robotModels.ts` (batched SVG geometry).
- `viz/HullPainterVisualizer.tsx` → React UI consuming the shared barrel and `shared/viz` `PlaybackControls`.
