# 2022 Day 9 Shared Rope Physics & Visualization Helpers

## Consumer Usage
Import `MotionPlan`, `countVisitedTailCells`, `traceRopeBridge`, and `RopeTraceFrame` from `2022/day09/shared`.
Import `RopeBridgeVisualizer` directly from `2022/day09/shared/viz/RopeBridgeVisualizer` in React visualizers.

## Maintainer Architecture
- `motionPlan.ts`: Immutable Y-up value objects (`GridPoint`, `GridBounds`, `MotionCommand`, `MotionPlan`) with `O(M)` bounds computation.
- `simulation.ts`: `Int32Array` rope kinematics with early-break cascade, adaptive `DenseTailTracker` (`Uint8Array`) vs `SparseTailTracker` (`Set<string>`), and uniformly sampled `RopeTraceFrame` emission.
- `viz/ropeViewport.ts`: Pure TS canvas viewport projection (`RopeViewport`) and `O(uniqueTailCells)` cumulative trail indexing (`buildCumulativeTailIndex`).
- `viz/RopeCanvas.tsx` & `viz/RopeBridgeVisualizer.tsx`: HiDPI canvas renderer and playback UI.
