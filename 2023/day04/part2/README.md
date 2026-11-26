# 2023 Day 04 Part 2 — Scratchcards

## Consumer Guide

- **Domain entrypoint** ([domain/index.ts](domain/index.ts)): exports `solver` (`parse`, `solve`, `trace`), `CascadeTraceFrame`, `DEFAULT_MAX_TRACE_STEPS` (`200`), `countTotalScratchcards`, and `traceScratchcardCascade`.
- **Site manifest** ([index.ts](index.ts)): registers metadata, official 6-card example (`exampleAnswer: '30'`), `solver`, and `CascadeWaveVisualizer`.

## Maintainer Guide

- `countTotalScratchcards` executes an O(N) forward sweep using a `bigint` difference array (`delta`), computing `copies = 1n + bonus` per card and applying `+copies` / `-copies` range updates clamped at `totalCards - 1`.
- `CascadeTraceFrame` is a frozen value object storing only `cardIndex`, `card`, and the immutable `cardCopies` snapshot; all metrics (`activeCopies`, `clampedEndIndex`, `clampedSpan`, `spawnedCopies`, `runningTotal`, `projectedTotal`, `peakCopies`) are dynamic getters.
- `traceScratchcardCascade` validates `maxSteps` upfront, samples frames via `sampleTraceIndices`, and uses `card.matchCount` directly (never `card.points`, which caps at `k = 53`).
- `CascadeWaveVisualizer` delegates scaling/windowing to `viz/waveLayout.ts` (using `bigintLog2` and BigInt division) and renders an interactive SVG cascade wave with Bezier fan-out arcs, `Log2`/`Linear` toggle, and `PlaybackControls`.
