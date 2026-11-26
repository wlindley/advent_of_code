# 2023 Day 02 Part 1 — Cube Conundrum

## Consumer Guide

- **Domain entrypoint** ([domain/index.ts](domain/index.ts)): exports `solver` (`parse`, `solve`, `trace`), `PART1_LIMITS` (`12 red, 13 green, 14 blue`), `DEFAULT_MAX_TRACE_STEPS` (`200`), `CubeGameTraceFrame`, `solveGames`, and `traceGames`.
- **Site manifest** ([index.ts](index.ts)): registers metadata, official 5-game example (`exampleAnswer: '8'`), `solver`, and `CubeConundrumVisualizer`.

## Maintainer Guide

- Each game's minimum viable bag is computed dynamically as the component-wise maximum across its reveals (`GameRecord.minimumBag`), and feasibility is checked via `fitsWithin(PART1_LIMITS)`.
- `traceGames` evaluates every game to maintain exact `runningSum` and `possibleCount` values while sampling emitted frames with `sampleTraceIndices` from `shared/core`.
- `CubeConundrumVisualizer` is a thin presentation component rendering an SVG peak envelope bar chart against dashed `12/13/14` limit markers, a per-reveal strip, a clickable 6-game window, and `PlaybackControls`.
