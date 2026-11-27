# 2021 Day 18 Shared Domain — Snailfish

Pure TypeScript flat-depth domain model, parser, reducer, policy-driven analyzer, bounded tracer, and solver for Snailfish number arithmetic.

## Consumer Interface (`shared/index.ts`)

- **Model (`snailfish.ts`)**: `SnailfishLeaf`, `SnailfishNumber` (validates binary pair trees via greedy depth-stack collapse; dynamic `leafCount`, `maxDepth`, `magnitude`, `toString()`), `SnailfishHomework`, and `formatSnailfish`.
- **Parser (`parser.ts`)**: `parseSnailfishNumber` and `parseSnailfishHomework` using strict cursor validation (`SyntaxError` / `RangeError`).
- **Reducer (`reducer.ts`)**: `combineUnreduced`, `stepReduceSnailfish`, `reduceSnailfish`, `addSnailfish`, and `addSnailfishMagnitude` implementing leftmost depth `>= 5` explosions and value `>= 10` splits.
- **Analysis & Policy (`analyzer.ts`, `policy.ts`)**: `sumHomework`, `findMaxPair`, `HOMEWORK_SUM_POLICY` (Part 1), and `MAX_PAIR_MAGNITUDE_POLICY` (Part 2).
- **Tracing & Solver (`trace.ts`, `solver.ts`)**: `traceSnailfish` (bounded via `sampleTraceIndices` & `validateMaxSteps`) and `SnailfishSolver`.

## Maintainer Architecture

- **Flat Depth Representation**: Each snailfish number is stored as an immutable leaf array `(value, depth)` so explode neighbor carries are `O(1)` index updates on local `number[]` buffers encapsulated inside `reducer.ts` (zero input mutation).
- **One-Way DAG**: `snailfish` -> `parser` -> `reducer` -> `analyzer` -> `policy` -> `trace` -> `solver` -> `index.ts`. `shared/index.ts` is 100% pure TS with zero React/DOM imports; UI components live exclusively under `shared/viz/`.
