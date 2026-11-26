# 2022 Day 16 Shared Domain

## Consumer Guide
- **Entrypoint**: `./index.ts` exports pure TypeScript domain primitives with zero React/DOM dependencies (`ValveNetwork`, `parseValveNetwork`, `CompressedValveNetwork`, `ValveSchedule`, `MaskPressureTable`, `computeBestByMask`, `findOptimalSchedule`, `buildValveTimeline`).
- **Visualization component**: `./viz/ValveNetworkSvg.tsx` renders an interactive radial SVG graph supporting 1 or 2 agents (`You`, `Elephant`).

## Maintainer Notes
- **Module DAG**: `valveNetwork.ts` -> `compressedNetwork.ts` -> `pressureSearch.ts` -> `timeline.ts` -> `index.ts`.
- **Compression**: `CompressedValveNetwork` retains only valves reachable from `AA` with `flowRate > 0` (plus `AA` at the tail if `flowRate === 0`), sorted descending by `flowRate` (tie-broken alphabetically) into a flat `Int32Array` shortest-distance matrix.
- **Search**:
  - `findOptimalSchedule` runs admissible Branch-and-Bound DFS with a descending-flow upper bound (`rem -= 2` per step, or `timeLeft - 1` if standing on an unvisited positive valve).
  - `computeBestByMask` runs feasibility-pruned DFS without global-best pruning so Part 2 SOS Max-DP receives exact per-mask optima.
- **Timeline**: `buildValveTimeline` uses `sampleTraceIndices` to bound trace length and validates disjoint agent schedules.
