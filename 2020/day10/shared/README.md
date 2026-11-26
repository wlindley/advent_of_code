# 2020 Day 10 Shared Domain (`Adapter Array`)

## Consumer Guide

Import pure domain models, DP evaluators, trace builders, viewport projections, and solvers from `2020/day10/shared`:

- `parseAdapterChain(raw)` -> immutable `AdapterChain` storing `[0, ...sortedAdapters, max + 3]` with `joltageAt`, `nodeKind`, `stepDelta`, and `predecessorIndices`.
- `countJoltDifferences(chain)` / `collectJoltSteps(chain)` -> `JoltHistogram` (`diff1`, `diff2`, `diff3`, `part1Product`) and `JoltStep` transitions.
- `computeArrangementTable(chain)` -> exact `BigInt` `ArrangementTable` (`totalArrangements`, `maxWaysLog2`, `stepAt`, `waysAt`).
- `traceDifferences(chain, maxSteps)` / `traceArrangements(chain, maxSteps)` -> budget-bounded `AdapterTraceFrame[]` (`DifferenceTraceFrame | ArrangementTraceFrame`).
- `computeChainViewport(chain, frame, maxSlots)` -> bounded `ChainViewport` with monotonic `maxWaysLog2` scaling and clipped predecessor jump arcs.
- `JOLTAGE_DIFF_PRODUCT_POLICY` / `ARRANGEMENT_COUNT_POLICY` -> `AdapterChainPolicy` strategies for Parts 1 and 2.
- `new AdapterArraySolver(policy)` -> `PuzzleSolver` exposing `parse`, `solve`, `trace`, and `policy`.

Interactive React visualizers live under `2020/day10/shared/viz/` and are never exported by `shared/index.ts`.

## Maintainer Architecture

Strict one-way DAG:

`shared/core -> chain.ts -> (differences.ts, arrangements.ts) -> trace.ts -> (viewport.ts, policy.ts) -> solver.ts -> index.ts`

- Every domain entity is frozen (`Object.freeze(this)`) with zero stored derived state.
- `AdapterChain` constructor enforces all semantic invariants (non-empty, positive safe integers, numeric sort, no duplicates, consecutive gap <= 3) before appending `max + 3`.
- `ArrangementTraceFrame` shares a single frozen `ArrangementTable` in `O(1)` per frame.
- `computeChainViewport` avoids max-scan loops by reading monotonic `bigintLog2(frame.ways)` and skips off-viewport predecessor arcs (`p < start`).
