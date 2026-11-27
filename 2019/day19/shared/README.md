# Day 19 Shared Tractor Beam Kernel

Pure TypeScript Intcode beam probe, span-compressed grid, monotonic cone scanner, `gap <= -3` doubling square finder, and SVG layout helpers shared by 2019 Day 19 Parts 1 and 2.

## Consumer Guide

- `TractorBeamSolver`: `PuzzleSolver` parameterized by `AREA_SCAN_POLICY` (Part 1) or `CLOSEST_SQUARE_POLICY` (Part 2).
- `IntcodeBeamOracle`: Memoized `BeamOracle` running a fresh `IntcodeMachine` per uncached `(x, y)` query.
- `scanBeamGrid(oracle, gridSize)`: Sweeps `gridSize x gridSize` using monotonic left/right edges and an exact cone empty-row bound.
- `findClosestSquare(oracle, squareSize, limits)`: L-shell anchor search, doubling jump with `gap <= -3` safety guard, and monotonic walk.
- `buildTractorBeamSvgLayout(frame)`: Projects either `'scan'` or `'square'` trace frames into a `420x420` SVG viewBox.

## Maintainer Architecture

Strictly acyclic DAG (zero `viz/` imports in `index.ts`):
- `beamGrid.ts`: immutable `BeamGrid` backed by frozen `RowSpan` array.
- `beamProbe.ts`: `IntcodeBeamOracle` -> `2019/shared/intcode`.
- `beamScan.ts`: `scanBeamGrid` -> `beamGrid`, `beamProbe`.
- `beamSquare.ts`: `findClosestSquare` -> `beamGrid`, `beamProbe`.
- `beamSolver.ts`: policies & solver -> `shared/core`, `2019/shared/intcode`, `beamScan`, `beamSquare`.
- `vizLayout.ts`: SVG geometry projection -> `beamSolver`.
- `viz/TractorBeamVisualizer.tsx`: React SVG playback UI using `shared/viz` `PlaybackControls`.
