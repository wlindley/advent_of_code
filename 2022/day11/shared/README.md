# Day 11 Shared Keep Away Domain & Visualization

Shared pure-TypeScript simulation engine and reusable interactive visualizer for **Advent of Code 2022 Day 11 (Monkey in the Middle)**, parameterized by `KeepAwayRule` so Part 1 and Part 2 share parsing, trace generation, and rendering without duplication.

## Consumer Guide (`2022/day11/shared`)

- `parseWorryOperation(raw)` / `WorryOperation` (`AddConstantOperation`, `MultiplyConstantOperation`, `SquareOperation`): immutable worry transformers with dynamic `expression` strings.
- `KeepAwaySetup.parse(raw)` / `MonkeySpec`: validated immutable monkey network with derived `monkeyCount`, `totalItems`, and `commonModulus` (`lcmBigInt` of all test divisors).
- `KeepAwayRule` / `simulateKeepAway(setup, rule)` / `computeMonkeyBusiness(counts)` / `findTopTwoIndices(counts)`: rule-driven simulation returning frozen inspection counts and exact `BigInt` products.
- `buildKeepAwayTrace(setup, rule, options)` / `KeepAwayTraceFrame`: uniformly sampled round snapshots (`DEFAULT_MAX_TRACE_STEPS = 200`) containing counts, per-monkey queues, and cumulative throw matrices.
- `createKeepAwaySolver(rule)`: constructs a frozen `PuzzleSolver<KeepAwaySetup, bigint, KeepAwayTraceFrame>`.

## Maintainer Architecture

- **Pure TS Boundary**: `2022/day11/shared/index.ts` exports only pure domain modules and never imports or re-exports `viz/`.
- **Trajectory Equivalence**: `simulateKeepAway` evaluates each item's path independently (`round += 1` whenever `target < currentMonkey`), matching FIFO round-by-round execution while avoiding queue allocations.
- **Visualization (`viz/`)**: `KeepAwayVisualizer` and `ThrowNetworkSvg` consume any `PuzzleSolver<KeepAwaySetup, bigint, KeepAwayTraceFrame>` and `reliefLabel` to render the circular throw network, KPI badges, and queue ledger.
