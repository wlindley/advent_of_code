# `2024/day06/shared` — Lab Map & Guard Patrol Engine

## Consumer Guide
Pure immutable floorplan model and guard patrol simulator for Advent of Code 2024 Day 6 (Parts 1 & 2).

- `parseLabMap(raw)`: parses a rectangular `.` / `#` / `^>v<` map into a frozen `LabMap`.
- `simulatePatrol(map, options?)`: runs the patrol from `map.startRow, map.startCol, map.startDir` with optional `{ extraObstacle, recordSteps }`, returning a frozen `PatrolResult` (`outcome: 'exited' | 'loop'`, `visitedCount`, `wasVisited(r, c)`, `steps`).

## Maintainer Guide
- `direction.ts`: aligns `GuardDirection` (`0..3`) with `DIRS_4` from `shared/core` so clockwise turning is `((dir + 1) & 3)`.
- `labMap.ts`: wraps `Grid2D<boolean>` and enforces single-guard start validation at construction.
- `patrol.ts`: uses a flat `Uint8Array(map.size)` 4-bit direction mask for O(1) loop detection without heap allocations in the hot path when `recordSteps` is false. Turns re-evaluate the new facing direction on the next iteration so multi-wall corners resolve cleanly.
