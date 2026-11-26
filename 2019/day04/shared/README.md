# `2019/day04/shared` — Secure Container Engine

## Consumer Guide
Pure TypeScript 6-digit password search engine, run-length policy abstraction, and shared odometer visualizer for AoC 2019 Day 4.

- `parsePasswordRange(raw)` validates `"LOW-HIGH"` into an immutable `PasswordRange`.
- `AT_LEAST_PAIR_POLICY` (Part 1) and `EXACT_PAIR_POLICY` (Part 2) implement `RunLengthPolicy`.
- `createSecureContainerSolver(policy)` returns a frozen `PuzzleSolver<PasswordRange, number, PasswordTraceFrame>`.
- `viz/SecureContainerVisualizer.tsx` and `viz/OdometerStrip.tsx` render interactive playback frames.

## Maintainer Guide
- `candidate.ts`: immutable `PasswordAnalysis` with dynamic `isNonDecreasing` and `maxRunLength` getters; `ceilNonDecreasing` and `nextNonDecreasing` jump directly across non-monotone gaps.
- `policy.ts`: single `PredicateRunLengthPolicy` implementation parameterizing Part 1 vs Part 2 run-length rules without duplicated `accepts` logic.
- `range.ts`: `PasswordRange` enforces `[100000, 999999]` and `low <= high`; `parsePasswordRange` delegates numeric bounds exclusively to `PasswordRange`.
- `solver.ts`: `PasswordTraceFrame` computes `rejectedCount` and `skippedIntegers` dynamically; `tracePasswordSearch` bounds frames via `sampleTraceIndices`.
