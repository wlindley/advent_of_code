# 2019 Day 12 Part 2 — The N-Body Problem

## Consumer Documentation

Computes the first positive step at which the full 3D moon system repeats a previously visited `(position, velocity)` state using per-axis cycle decomposition and `BigInt` LCM.

- **Solver**: `export const solver` in `domain/solver.ts` (`new NBodySolver(FIRST_REPEAT_PERIOD_POLICY)`).
- **Manifest**: `export const manifest` in `index.ts` (Example 1 repeat period `2772`, Example 2 `4686774924`).
- **Visualizer**: `viz/Visualizer.tsx` binds the Part 2 solver to the shared `OrbitVisualizer`, rendering orbital motion alongside per-axis period lock telemetry (`18`, `28`, `44` -> `2772` on Example 1).

## Maintainer Documentation

- `part2/` contains zero duplicated physics, LCM, or projection logic; it wires `FIRST_REPEAT_PERIOD_POLICY` from `../shared` into `NBodySolver` and `OrbitVisualizer`.
- `domain/` is 100% pure TypeScript with zero React or DOM imports so `tools/aoc/cli.ts` executes it directly.
