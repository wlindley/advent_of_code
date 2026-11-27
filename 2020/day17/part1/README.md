# 2020 Day 17 Part 1: Conway Cubes

## User / Consumer Guide
Simulates six boot cycles of a 3D Conway cellular automaton seeded at `z = 0` and reports the final count of active cubes.

- **Solver**: `export const solver` in `domain/solver.ts` (`new ConwayCubesSolver(POCKET_3D_POLICY)`).
- **Manifest**: `export const manifest` in `index.ts` (`exampleInput` -> `'112'`).
- **Visualizer**: `ConwayPart1Visualizer` renders per-`z` HiDPI Canvas 2D slice cards with surviving, born, and dying diff states and playback controls.

## Developer / Maintainer Notes
- Delegates all parsing, separable 3D box-sum simulation, and trace sampling to `../../shared`.
- `domain/solver.ts` stays pure TypeScript with zero React/DOM dependencies so CLI and browser workers run identically.
