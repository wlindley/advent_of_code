# 2021 Day 23 Shared Domain & Visualizer (`2021/day23/shared`)

## Consumer Overview

Pure-TypeScript amphipod burrow modeling, parsing, move generation, A* search, and bounded trace generation shared across Part 1 (depth 2) and Part 2 (depth 4).

- `parseBurrow(raw)` parses a 5-line burrow diagram into 4 frozen `[top, bottom]` room pairs.
- `StandardBurrowPolicy` (`STANDARD_BURROW_POLICY`) prepares a depth-2 `BurrowState`.
- `findOptimalOrganization(start)` computes minimum total energy and optimal move sequence via A*.
- `createAmphipodSolver(policy)` constructs a `PuzzleSolver` parameterized by `BurrowPolicy`.
- `viz/` contains `BurrowVisualizer` and `AmphipodBurrowSvg` (`.tsx`-only, zero domain logic).

## Maintainer Notes

### Module DAG

```
constants.ts
  ├── burrow.ts (BurrowMove, BurrowState)
  ├── parser.ts (parseBurrow, BurrowDiagram)
  ├── heuristic.ts (estimateRemainingEnergy)
  └── moves.ts -> burrow.ts
policy.ts -> burrow.ts, constants.ts, parser.ts
search.ts -> burrow.ts, constants.ts, heuristic.ts, moves.ts, shared/core MinHeap
trace.ts -> burrow.ts, constants.ts, heuristic.ts, moves.ts, parser.ts, policy.ts, search.ts
solver.ts -> parser.ts, policy.ts, search.ts, trace.ts
index.ts -> pure TS barrel (zero viz imports)
```

### Invariants

- `BurrowState` stores only `key` and `roomDepth`; `settledCount` and `isGoal` are computed dynamically.
- `BurrowMove` stores only `species`, `from`, `to`; `steps` and `energy` are computed dynamically.
- `findForcedHomeMove` prunes branching whenever a legal home-room entry is open, preserving optimality while shrinking the A* search graph.
