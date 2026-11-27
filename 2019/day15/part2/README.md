# 2019 Day 15 Part 2 — Oxygen System

## Consumer Guide

- **Entry point**: `manifest` in `index.ts` and `solver` in `domain/solver.ts`.
- **CLI execution**: `npm run aoc -- run 2019 15 2` (or pass `--input <path>`).
- **Behavior**: Parses an Intcode repair droid program, explores the full reachable compartment via iterative DFS with backtracking, and computes the total minutes required for oxygen to reach all open tiles from the oxygen system.
- **Visualizer**: `viz/Visualizer.tsx` renders an interactive blueprint playback of up to `120` sampled frames across droid exploration and oxygen BFS wavefront expansion.

## Maintainer Guide

- `domain/solver.ts` instantiates `new OxygenSystemSolver(OXYGEN_FILL_MINUTES_POLICY)` from `../../shared`.
- `domain/index.ts` re-exports `solver` for manifest and CLI consumers with zero React or DOM imports.
- `viz/Visualizer.tsx` delegates rendering to `ShipCompartmentVisualizer` bound to Part 2's `solver`.
