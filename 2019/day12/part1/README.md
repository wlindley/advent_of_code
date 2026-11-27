# 2019 Day 12 Part 1 — The N-Body Problem

## Consumer Documentation

Computes the total mechanical energy (`sum of potential * kinetic`) of a moon system after 1000 discrete gravity-and-velocity steps.

- **Solver**: `export const solver` in `domain/solver.ts` (`new NBodySolver(TOTAL_ENERGY_1000_POLICY)`).
- **Manifest**: `export const manifest` in `index.ts`. Note that AoC prose verifies 10 steps (`179`) on Example 1 and 100 steps (`1940`) on Example 2, while `manifest.exampleAnswer` (`183`) is Part 1's 1000-step output on Example 1 (cross-verified against both an independent 3D simulator and the modular axis periods `(1000 mod 18, 1000 mod 28, 1000 mod 44)`).
- **Visualizer**: `viz/Visualizer.tsx` binds the Part 1 solver to the shared `OrbitVisualizer` with 3D isometric and dual XY/XZ projection modes.

## Maintainer Documentation

- `part1/` contains zero duplicated physics or projection logic; it wires `TOTAL_ENERGY_1000_POLICY` from `../shared` into `NBodySolver` and `OrbitVisualizer`.
- `domain/` is 100% pure TypeScript with zero React or DOM imports so `tools/aoc/cli.ts` executes it directly.
