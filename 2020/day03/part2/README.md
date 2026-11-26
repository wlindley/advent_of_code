# 2020 Day 3 Part 2 — Toboggan Trajectory

## User Guide
- Entrypoint: `manifest` in `2020/day03/part2/index.ts` and `solver` in `2020/day03/part2/domain/solver.ts`.
- Parses a rectangular `.` / `#` forest grid and multiplies `#` tree landings across slopes `(1, 1)`, `(3, 1)`, `(5, 1)`, `(7, 1)`, and `(1, 2)` as a `bigint`.

## Developer Notes
- `part2/domain/solver.ts` delegates directly to `createTobogganSolver(PART2_SLOPES)`.
- `part2/viz/TobogganPart2Visualizer.tsx` binds `PART2_SLOPES` to `TobogganTrajectoryVisualizer`.
- Zero domain logic lives in `part2/viz/` or `part2/index.ts`.
