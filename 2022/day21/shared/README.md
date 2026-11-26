# 2022 Day 21 Shared Domain & Visualization

## Consumer Guide

Pure TypeScript barrel (`index.ts`) providing validated DAG parsing, exact rational arithmetic, algebraic equality solving, and bounded trace generation for *Monkey Math* (Parts 1 and 2):

- `parseMonkeyRiddle(raw)` -> `MonkeyRiddle`: validates syntax, operators, missing operands, duplicates, and acyclicity.
- `solveRootYell(riddle, rootName)` -> `bigint`: evaluates the reachable bottom-up DAG using exact `Rational` arithmetic.
- `solveEqualityUnknown(riddle, rootName, unknownName)` -> `bigint`: solves `left(x) = right(x)` via single-path top-down inversion or multi-path `AffineExpr` elimination.
- `buildEvaluationTrace(...)` / `buildEqualitySolveTrace(...)` -> `readonly MonkeyTraceFrame[]`: produces step-sampled, node-bounded (`MAX_FOCUSED_NODES = 15`) frames for `viz/MonkeyMathVisualizer.tsx`.

## Maintainer Guide

- **Module DAG**: `operators` -> `riddle` -> `parser` -> `evaluator` -> `trace` -> `index` -> `viz/*`.
- **Invariants**:
  - `MonkeyRiddle` validates every operand before building `DirectedGraph` and calls `topologicalOrder()` to enforce acyclicity.
  - `solveEqualitySolution` computes `unknownPathCounts` bottom-up on `reachableBottomUp(rootName)` and evaluates only `count === 0n` nodes as constants, avoiding division-by-zero from dummy `humn` values.
  - `BINARY_OPERATORS['/']` explicitly guards zero divisors during both `invertLeft` and `invertRight`.
  - `index.ts` stays 100% pure TypeScript with zero React/DOM imports so CLI and Part 1/2 domains remain decoupled from `viz/`.
