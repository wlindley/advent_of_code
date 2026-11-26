# `2020/day01/shared` — Report Repair Core & Visualization Primitives

## Consumer Guide
Pure TypeScript domain model and generalized sorted `k`-sum solver for Advent of Code 2020 Day 1 (`k = 2` for Part 1, `k = 3` for Part 2), plus reusable React visualization components under `viz/`.

- `parseExpenseReport(raw)` / `ExpenseReport`: validates non-empty non-negative safe integer expense entries while preserving original input order alongside an ascending sorted view.
- `findKSumTuple(report, tupleSize, target)`: finds the first `tupleSize`-tuple summing to `target` (`TARGET_EXPENSE_SUM = 2020`) and computes its `sum` and `product`.
- `traceKSumSearch(report, tupleSize, target, maxSteps?)`: captures up to `maxSteps` (`120` default) uniformly sampled `KSumTraceFrame` snapshots for bounded UI animation.
- `viz/ExpenseRepairVisualizer.tsx`: parameterizable React visualizer (`tupleSize`, `rawInput`) combining `ExpenseBarChart`, `SumDeltaGauge`, and `PlaybackControls`.

## Maintainer Guide
- **Module DAG**: `expenseReport.ts` → `kSum.ts` → `kSumTrace.ts` → `index.ts`; `viz/*.tsx` imports from `../index` and `../../../../shared/viz`. `index.ts` remains pure TypeScript with zero React/DOM imports.
- **Immutability & Sampling**: `ExpenseReport`, `ExpenseMatch`, and `KSumTraceFrame` freeze copies of inputs and compute derived values dynamically via getters. `traceKSumSearch` runs a two-pass count-then-sample walk via `ProbeObserver` without outer-anchor pruning so at least one probe frame is always emitted for valid inputs.
