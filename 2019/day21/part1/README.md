# 2019 Day 21 Part 1 — Springdroid Adventure

## Consumer Guide

- **Entry point**: `manifest` in `index.ts` and `solver` in `domain/solver.ts`.
- **CLI execution**: `npm run aoc -- run 2019 21 1` (or pass `--input <path>`).
- **Behavior**: Feeds a 5-instruction `WALK` Springscript program (`J = !(A && B && C) && D`) into the Intcode VM and returns the reported `bigint` hull damage.
- **Visualizer**: `viz/Visualizer.tsx` renders an interactive light-mode SVG playback of sampled hull-crossing frames with `A..D` sensor pins, jump/walk arcs, live `(T, J)` register traces, and ASCII console output.

## Maintainer Guide

- `domain/solver.ts` instantiates `new SpringdroidSolver(WALK_POLICY)` from `../../shared`.
- `domain/index.ts` re-exports `solver` for manifest and CLI consumers with zero React or DOM imports.
- `viz/Visualizer.tsx` delegates rendering to `SpringdroidVisualizer` bound to Part 1's `solver`.
