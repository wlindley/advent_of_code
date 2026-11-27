# 2020 Day 15 — Rambunctious Recitation Shared Domain

## User / Consumer Guide

Pure TypeScript domain package modeling the AoC 2020 Day 15 memory game across arbitrary target turns (`PART1_TARGET_TURN = 2020`, `PART2_TARGET_TURN = 30_000_000`):

- **`model.ts`**: Constants, `validateTargetTurn`, immutable `StartingSequence` (with dynamic `length` and `maxInitialValue` getters), and `parseStartingSequence`.
- **`engine.ts`**: `LastSeenTable` (`Uint32Array` dense fast path + `Map` overflow), `RecentTurnBuffer` (bounded 16-turn circular snapshot buffer), and `playMemoryGame`.
- **`solver.ts`**: `MemoryGameSolver` implementing `PuzzleSolver<StartingSequence, number, MemoryGameTraceFrame>`, `MemoryGameTraceFrame` snapshots with dynamic getters (`isFinal`, `isHorizonTruncated`, `age`, `seedCount`, `repeatRatio`), and `buildTraceTurns` (dense 16-turn prefix + uniformly sampled tail capped at `MAX_TRACE_TURN = 20_000`).
- **`projection.ts`**: Pure UI projection helpers (`formatRuleFormula`, `projectTurnTimeline`, `projectGrowthSparkline`).
- **`index.ts`**: Pure TypeScript barrel (zero `viz/` or DOM imports).

## Developer / Maintainer Guide

- **Commit-on-Speak Invariant**: Each turn computes its spoken number from the prior turn's lookup result and immediately exchanges `(spoken, turn)` into `LastSeenTable`, ensuring duplicate seeds (e.g. `3,3`) preserve accurate `distinctCount` and prior-turn ages.
- **TypedArray Safety**: `LastSeenTable` encapsulates a mutable `Uint32Array` internally (never frozen via `Object.freeze`) and exposes only frozen `MemoryGameTraceFrame` snapshots.
- **Oracles**: `oracle.test.ts` cross-checks both `playMemoryGame` and `MemoryGameSolver.trace` against an independent `lastIndexOf` history-scan oracle across official examples, duplicate/overflow edge cases, and 25 seeded PRNG sequences.
