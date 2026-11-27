# 2019 Day 11 Part 1 — Space Police

## Consumer Guide

- **Entry point**: `manifest` in `index.ts` and `solver` in `domain/solver.ts`.
- **CLI execution**: `npm run aoc -- solve 2019 11 1` (or pass custom Intcode input).
- **Behavior**: Parses a complete Intcode program, runs the hull-painting robot starting at `(0, 0)` facing `UP` on an all-black hull (`startPanelColor = 0`), and returns the number of distinct panels painted at least once.
- **Visualizer**: `viz/Visualizer.tsx` renders an interactive playback of up to `120` sampled frames showing once-painted and repainted black/white panels, recent robot trail, and heading arrow.

## Maintainer Guide

- `domain/solver.ts` instantiates `new PaintingRobotSolver(PAINTED_COUNT_POLICY)` from `../../shared`, delegating all VM orchestration, robot kinematics, and trace sampling to the shared Day 11 kernel.
- `domain/index.ts` re-exports `solver` for manifest and CLI consumers without any React/DOM imports.
- `viz/Visualizer.tsx` delegates rendering to `HullPainterVisualizer` with `solver` bound to Part 1's policy.
