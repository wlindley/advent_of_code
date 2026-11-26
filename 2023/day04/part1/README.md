# 2023 Day 04 Part 1 — Scratchcards

## Consumer Guide

- **Domain entrypoint** ([domain/index.ts](domain/index.ts)): exports `solver` (`parse`, `solve`, `trace`), `DEFAULT_MAX_TRACE_STEPS` (`200`), `ScratchcardTraceFrame`, `addSafePoints`, `sumScratchcardPoints`, and `traceScratchcards`.
- **Site manifest** ([index.ts](index.ts)): registers metadata, official 6-card example (`exampleAnswer: '13'`), `solver`, and `ScratchcardsVisualizer`.

## Maintainer Guide

- Each `Scratchcard` computes `matchingNumbers` (owned-list order via `Set`), `matchCount`, and `points` (`2 ** (k - 1)`, guarded by `MAX_SAFE_MATCH_COUNT = 53`) dynamically without stored derived state.
- `addSafePoints` enforces `Number.isSafeInteger` on cumulative totals, throwing `RangeError` on overflow.
- `traceScratchcards` evaluates every card to keep exact `runningTotal` and `winningCardCount` while sampling emitted frames via `sampleTraceIndices` from `shared/core`.
- `ScratchcardsVisualizer` renders a status badge strip, winning/owned number board, compact SVG doubling points ladder, 6-card jump strip, and `PlaybackControls`.
