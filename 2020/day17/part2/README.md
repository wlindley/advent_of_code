# 2020 Day 17 Part 2: Conway Cubes

## User / Consumer Guide
Simulates six boot cycles of a 4D hypercube Conway cellular automaton seeded at `z = 0, w = 0` and reports the final count of active hypercubes.

- **Solver**: `export const solver` in `domain/solver.ts` (`new ConwayCubesSolver(POCKET_4D_POLICY)`).
- **Manifest**: `export const manifest` in `index.ts` (`exampleInput` -> `'848'`).
- **Visualizer**: `ConwayPart2Visualizer` renders per-`z` HiDPI Canvas 2D slice cards with hyperplane `w` selection, surviving/born/dying diff states, and playback controls.

## Developer / Maintainer Notes
- Delegates all parsing, separable 4D box-sum simulation, and trace sampling to `../../shared`.
- `domain/solver.ts` stays pure TypeScript with zero React/DOM dependencies so CLI and browser workers run identically.
