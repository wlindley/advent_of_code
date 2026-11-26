# 2020 Day 3 Part 1 — Toboggan Trajectory

## User Guide
- Entrypoint: `manifest` in `2020/day03/part1/index.ts` and `solver` in `2020/day03/part1/domain/solver.ts`.
- Parses a rectangular `.` / `#` forest grid and counts `#` tree landings along `(right: 3, down: 1)` starting after `(0, 0)`.

## Developer Notes
- `part1/domain/solver.ts` delegates directly to `createTobogganSolver(PART1_SLOPES)`.
- `part1/viz/TobogganPart1Visualizer.tsx` binds `PART1_SLOPES` to `TobogganTrajectoryVisualizer`.
- Zero domain logic lives in `part1/viz/` or `part1/index.ts`.
