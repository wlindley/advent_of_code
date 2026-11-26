# 2024 Day 19 Shared Domain & Visualization

Pure-TypeScript stripe model, linen layout parser, flat `TypedArray` prefix trie, exact `bigint` DP solver with witness reconstruction, and bounded trace builder for Advent of Code 2024 Day 19 (Part 1 and Part 2 ready).

## Consumer Guide

Import pure domain symbols from `./index` (zero React/DOM imports):

- `STRIPE_COLORS`, `STRIPE_COUNT`, `stripeToIndex`, `assertValidStripeSequence` — canonical `w/u/b/r/g` stripe alphabet validation and `[0..4]` mapping.
- `LinenLayout`, `DesignAnalysis` — frozen value objects with dynamic getters (`patternCount`, `designCount`, `maxPatternLength`, `maxDesignLength`, `wayCount`, `possible`, `furthestReachable`).
- `parseLinenLayout(raw)` — normalizes CRLF, deduplicates patterns preserving order, and validates strict `patterns / blank / designs` structure.
- `PatternTrie` (`NO_CHILD`) — preallocated `Int32Array` + `Uint8Array` 5-way trie with `fromPatterns`, `next`, `isTerminal`, and `has`.
- `analyzeDesign`, `analyzeLayout`, `countPossibleDesigns`, `countTotalArrangements` — `bigint` prefix DP with canonical witness recovery.
- `buildLinenTrace(layout, options?)` (`DEFAULT_MAX_TRACE_STEPS = 80`) — endpoint-preserving sampled trace carrying exact cumulative totals across all designs.

Visual components in `./viz/`: `LinenRibbon.tsx` and `LinenVisualizer.tsx`.

## Maintainer Guide

- **Module DAG**: `model.ts` -> `parser.ts` / `trie.ts` -> `dp.ts` -> `trace.ts` -> `index.ts`. `shared/viz/` imports only from `../index` and `../../../../shared/...`.
- **Invariants**: `PatternTrie` freezes only the class instance (`Object.freeze(this)`) and never freezes its internal TypedArrays. `DesignAnalysis` validates `prefixWays` and witness invariants at construction so impossible designs always carry `null` witness and `wayCount === 0n`.
- **Verification**: `dp.oracle.test.ts` cross-checks the Trie DP against an independent recursive memoized `startsWith` oracle across 30 seeded random layouts, exhaustive short-string partition enumeration, `> 2^64` BigInt Fibonacci/8-step stress cases, and late dead-end traps.
