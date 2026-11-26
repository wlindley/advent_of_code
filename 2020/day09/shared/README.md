# 2020 Day 9 Shared Domain (`Encoding Error`)

## Consumer Guide

Import pure domain types, policies, viewport projections, and solvers from `2020/day09/shared`:

- `parseXmasStream(raw)` -> immutable `XmasStream` of strictly positive `bigint` values (`at(i)` bounds-checked).
- `findFirstInvalidStep(stream, preambleLength)` / `collectPreambleChecks(stream, preambleLength)` -> `WindowCheckStep` with optional `SumPairMatch` (`a !== b` distinct-value pair).
- `findContiguousWeakness(stream, target)` / `collectWeaknessSteps(stream, target)` -> `ContiguousWeakness` (`[startIndex, endIndex]`, `minIndex`, `maxIndex`, `encryptionWeakness(stream)`).
- `FIRST_INVALID_POLICY` / `ENCRYPTION_WEAKNESS_POLICY` -> `XmasAttackPolicy` strategies for Part 1 and Part 2.
- `tracePreambleScan(stream, preambleLength, maxSteps)` / `traceWeaknessAttack(stream, preambleLength, maxSteps)` -> budget-bounded `XmasTraceFrame[]` (`PreambleScanFrame | WeaknessScanFrame`).
- `computeSignalViewport(stream, focusStart, focusEnd, maxSlots)` -> log2-scaled `SignalViewport` capped at `maxSlots` bars.
- `new XmasAttackSolver(policy, preambleLength)` -> `PuzzleSolver` exposing `parse`, `solve`, `trace`, `policy`, and `preambleLength`.

Interactive React visualizers live separately under `2020/day09/shared/viz/` and are never re-exported by `shared/index.ts`.

## Maintainer Architecture

Strict one-way DAG:

`shared/core -> stream.ts -> (window.ts, weakness.ts, viewport.ts) -> trace.ts -> policy.ts -> solver.ts -> index.ts`

- Every domain value object is frozen (`Object.freeze(this)`) with zero stored derived state.
- `window.ts` maintains only `lastIndex: Map<bigint, number>`, evicting `outVal` only when `lastIndex.get(outVal) === windowStart` and scanning left-to-right so `p < q` holds without index swaps.
- `weakness.ts` exploits strict positivity (`values > 0n`, `target > 0n`) so shrinking `while (sum > target)` requires no `left <= right` guard and uses `<` / `>=` extrema scans to keep `minIndex !== maxIndex`.
