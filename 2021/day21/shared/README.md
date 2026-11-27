# 2021 Day 21 Shared Domain

## User / Consumer Overview
Pure TypeScript domain modules for Advent of Code 2021 Day 21 (*Dirac Dice*), supporting both the deterministic 100-sided practice game (Part 1) and the quantum 3-sided splitting universe game (Part 2).

- `parseDiracDice(raw)`: parses two-line starting positions into an immutable `DiracDiceInput`.
- `solveDeterministicGame(input, target)` / `traceDeterministicGame(input, target, options)`: runs and samples the deterministic game.
- `solveQuantumGame(input, target)` / `traceQuantumGame(input, target, options)`: exact `BigInt` sparse wavefront DP and round-by-round distribution trace.

## Developer / Maintainer Notes
- **Module DAG**: `types` <- `parser`, `deterministic`, `quantum` <- `shared/index.ts`. `shared/index.ts` is strictly pure TS; React components live in `shared/viz/`.
- **Single Source of Truth**: `DeterministicTurnFrame` and `QuantumTraceFrame` store only primary state and expose derived quantities (`rollCount`, `rollSum`, `losingScore`, `product`, `activeUniverses`) as getters.
- **Wavefront Memory**: `quantum.ts` uses double-buffered plain `bigint[]` tables with `O(|active|)` reset and a separate post-round pass for 10-space weights.
