# `2022/day01/shared`

## Consumer Guide
Shared pure-TypeScript domain primitives for Advent of Code 2022 Day 1 ("Calorie Counting").

### Public API (`2022/day01/shared/index.ts`)
- `ElfInventory`: frozen value object holding `elfNumber` (1-based positive safe integer) and `items` (non-empty frozen positive safe integers), with dynamically computed `itemCount` and `totalCalories` getters.
- `parseCalorieInventories(raw)`: parses blank-line-separated calorie blocks (`LF` or `CRLF`, tolerating leading/trailing/multiple blank lines) with 1-based line-numbered validation errors.
- `rankTopElves(inventories, topCount)`: returns a frozen descending leaderboard of the top `topCount` Elves in one pass (ties preserve earlier `elfNumber`).
- `sumCalories(inventories)`: sums `totalCalories` across inventories with `Number.MAX_SAFE_INTEGER` overflow protection.
- `traceTopElves(inventories, topCount, options?)`: simulates all Elves and emits up to `maxSteps` (`120` default) frozen `CalorieTraceFrame` snapshots sampled via `sampleTraceIndices`.

## Maintainer Guide
- **Pure domain**: depends only on `shared/core` (`sampleTraceIndices`, `validateMaxSteps`, `TraceOptions`); zero DOM/React/Node dependencies.
- **Invariants**: `ElfInventory` validates `elfNumber`, non-empty items, positive safe integers, and per-Elf sum bounds on construction and avoids stored derived state. `insertLeader` uses strict `>` so ties retain earlier Elves and returns the existing frozen reference when unchanged, allowing `traceTopElves` to detect `enteredLeaderboard` via reference inequality.
