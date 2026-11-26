# 2020 Day 7 Shared Domain (`Handy Haversacks`)

## Consumer Guide

Import pure domain types, policies, layout helpers, and solvers from `2020/day07/shared`:

- `parseBagRuleGraph(raw)` -> validated immutable `BagRuleGraph` of `BagRule` and `BagContainment` value objects (`BigInt` quantities).
- `ANCESTOR_COLORS_POLICY` / `NESTED_BAG_COUNT_POLICY` -> `BagQueryPolicy` strategies for Part 1 reverse-BFS ancestor colors and Part 2 topological longest-path multiplicity DP.
- `traceBagQuery(graph, policy, targetColor, maxSteps)` -> budget-bounded `BagTraceFrame[]` snapshots preserving progressive layer discovery.
- `layoutBagTraceFrame(frame, maxVisiblePerLayer)` -> pure SVG coordinate layout with per-layer truncation and upward cubic Bezier curves for skip-layer edges.
- `new HaversackSolver(policy, targetColor)` -> `PuzzleSolver` implementation exposing `parse`, `solve`, and `trace`.

Interactive React visualizers live separately under `2020/day07/shared/viz/` and are never re-exported by `shared/index.ts`.

## Maintainer Architecture

Strict one-way DAG:

`shared/core -> rule.ts -> graph.ts -> policy.ts -> trace.ts -> (layout.ts, solver.ts) -> index.ts`

- Every domain value object is deeply frozen (`Object.freeze(this)`) with zero stored derived state.
- `BagRuleGraph` validates non-empty rules, unique outer colors, and defined inner colors before constructing `DirectedGraph`.
- `AncestorColorsPolicy` records reverse-BFS edges only where `depth[to] === depth[from] + 1`, handling cycles and missing targets cleanly.
- `NestedBagCountPolicy` runs Kahn topological sort on the reachable subgraph from `targetColor`, failing only on reachable cycles while ignoring unreachable cycles.
