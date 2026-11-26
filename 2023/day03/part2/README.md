# 2023 Day 03 Part 2 — Gear Ratios

## Consumer Guide

- **Domain entrypoint** ([domain/index.ts](domain/index.ts)): exports `solver` (`parse`, `solve`, `trace`), `gearRatioOf`, `sumGearRatios`, `DEFAULT_MAX_TRACE_STEPS` (`200`), `GearTraceFrame`, and `traceGears`.
- **Site manifest** ([index.ts](index.ts)): registers metadata (`puzzleUrl: 'https://adventofcode.com/2023/day/3#part2'`), the 10×10 example (`exampleAnswer: '467835'`), `solver`, and `GearInspectorVisualizer`.

## Maintainer Guide

- `gearRatioOf` returns `BigInt(a) * BigInt(b)` when a `'*'` candidate touches exactly two distinct `PartNumber` entries, or `null` otherwise.
- `sumGearRatios` filters `schematic.symbols` by `symbol.isGearCandidate`, queries `schematic.adjacentNumbersOf(symbol)`, and accumulates `bigint` products without a global visited-part bitset so shared parts contribute to every adjacent gear.
- `traceGears` walks all `'*'` candidates to keep exact `runningSum`, `confirmedGearIds`, and deduplicated `gearPartIds`, emitting up to `maxSteps` frozen `GearTraceFrame` snapshots with dynamic `isGear`, `ratio`, and `gearCount` getters.
- `GearInspectorVisualizer` renders a full SVG grid for small inputs (`<= 20×30`) or a `<canvas>` overview paired with a 15×15 local SVG lens (`gearCanvas.ts`), using `PlaybackControls` and handling 0-candidate or invalid inputs gracefully.
