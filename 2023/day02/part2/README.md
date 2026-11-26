# 2023 Day 02 Part 2 — Cube Conundrum

## Consumer Guide

- **Domain entrypoint** ([domain/index.ts](domain/index.ts)): exports frozen `solver` (`parse`, `solve`, `trace`), `DEFAULT_MAX_TRACE_STEPS` (`200`), `CubePowerTraceFrame`, `solveGames`, and `traceGames`.
- **Site manifest** ([index.ts](index.ts)): registers Part 2 metadata, official 5-game example (`exampleAnswer: '2286'`), `solver`, and `CubePowerVisualizer`.

## Maintainer Guide

- Each game's minimum viable bag is computed dynamically via `GameRecord.minimumBag` (component-wise maximum across reveals) and its power via `CubeBag.power`, avoiding stored derived state.
- `safeGamePower` and `safeAddPower` enforce `Number.isSafeInteger` on every game's power and cumulative sum, throwing `RangeError` on overflow.
- `traceGames` evaluates every game to maintain exact `runningPowerSum` and overflow checks while sampling emitted `CubePowerTraceFrame` snapshots via `sampleTraceIndices`.
- `CubePowerVisualizer` renders the minimum-bag RGB bar chart, power equation, high-water reveal strip, clickable sampled game power chart, and `PlaybackControls`.
