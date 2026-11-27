# 2020 Day 22 Shared Domain

## User Guide
Pure TypeScript domain package for AoC 2020 Day 22 (*Crab Combat*).
Instantiate `new CombatSolver(STANDARD_COMBAT_POLICY)` for Part 1 or
`new CombatSolver(RECURSIVE_COMBAT_POLICY)` for Part 2 via `./index.ts`.

## Developer Architecture
- `model.ts`: Strict two-player deck parser, `CombatDecks` validation, and reverse-positional `scoreDeck`.
- `deck.ts`: Unfrozen `Int32Array`-backed `DeckRingBuffer` and collision-free `encodeStateKey` (`String.fromCharCode` fast path + CSV fallback).
- `trace.ts`, `engine.ts`: 1-pass standard & recursive combat engine with pigeonhole sub-game shortcut (`subD1.maxCard() > subD2.maxCard()`) and bounded `CombatTraceFrame` sampling.
- `policies.ts`, `solver.ts`: Polymorphic `CombatPolicy` and `CombatSolver` (`PuzzleSolver`).
- `projection.ts`: Pure-TS head+tail deck ribbon windowing and round outcome projection for SVG rendering.
