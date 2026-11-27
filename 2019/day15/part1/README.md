# 2019 Day 15 Part 1 — Oxygen System

## Consumer Guide

- **Entry point**: `manifest` in `index.ts` and `solver` in `domain/solver.ts`.
- **CLI execution**: `npm run aoc -- run 2019 15 1` (or pass `--input <path>`).
- **Behavior**: Parses an Intcode repair droid program, explores the entire reachable compartment via iterative DFS with backtracking, and computes the minimum number of movement commands from `(0, 0)` to the oxygen system.
- **Visualizer**: `viz/Visualizer.tsx` renders an interactive blueprint playback of up to `120` sampled frames across droid exploration and BFS shortest-path wavefront expansion.

## Maintainer Guide

- `domain/solver.ts` instantiates `new OxygenSystemSolver(SHORTEST_PATH_POLICY)` from `../../shared`.
- `domain/index.ts` re-exports `solver` for manifest and CLI consumers with zero React or DOM imports.
- `viz/Visualizer.tsx` delegates rendering to `ShipCompartmentVisualizer` bound to Part 1's `solver`.
