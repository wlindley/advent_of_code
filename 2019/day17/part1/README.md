# 2019 Day 17 Part 1 — Set and Forget

## Consumer Guide

- **Entry point**: `manifest` in `index.ts` and `solver` in `domain/solver.ts`.
- **CLI execution**: `npm run aoc -- run 2019 17 1` (or pass `--input <path>`).
- **Behavior**: Executes the Intcode ASCII camera program, decodes the 2D scaffold frame, detects all interior 4-way scaffold intersections, and sums `x * y` as a `bigint`.
- **Visualizer**: `viz/Visualizer.tsx` renders an interactive row-by-row camera scan playback of up to `120` sampled frames highlighting scaffold beams, crossings, and the robot pose.

## Maintainer Guide

- `domain/solver.ts` instantiates `new ScaffoldSolver(ALIGNMENT_PARAMETERS_POLICY)` from `../../shared`.
- `domain/index.ts` re-exports `solver` for manifest and CLI consumers with zero React or DOM imports.
- `viz/Visualizer.tsx` delegates rendering to `ScaffoldVisualizer` bound to Part 1's `solver`.
