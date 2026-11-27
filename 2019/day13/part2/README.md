# 2019 Day 13 Part 2 — Care Package

## Consumer Guide

- **Entry point**: `manifest` in `index.ts` and `solver` in `domain/solver.ts`.
- **CLI execution**: `npm run aoc -- run 2019 13 2` (or pass `--input <path>`).
- **Behavior**: Patches `mem[0] = 2` for free play, feeds joystick tilts (`sign(ballX - paddleX)`) on demand as the Intcode cabinet runs, and returns the final score written to `(-1, 0)`.
- **Visualizer**: `viz/Visualizer.tsx` renders an interactive playback of up to `120` uniformly sampled play frames on an Atari-style Breakout screen with score banner, joystick tilt indicator, paddle, ball, and recent ball trail.

## Maintainer Guide

- `domain/solver.ts` instantiates `new ArcadeSolver(FREE_PLAY_SCORE_POLICY)` from `../../shared`, delegating memory patching, VM execution, joystick feedback, and trace replay to the shared Day 13 kernel.
- `domain/index.ts` re-exports `solver` for manifest and CLI consumers with zero React or DOM imports.
- `viz/Visualizer.tsx` delegates rendering to `ArcadeCabinetVisualizer` bound to Part 2's `solver`.
