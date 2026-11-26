# 2023 Day 06 Part 1 — Wait For It

## Consumer Guide

- **Domain entrypoint** ([domain/index.ts](domain/index.ts)): exports `solveRaceSheet` and `solver` (`parse`, `solve`, `trace`) using `parseRaceColumns` and `traceRaceSheet` from [../../shared](../../shared/index.ts).
- **Site manifest** ([index.ts](index.ts)): registers puzzle metadata, official 3-race example (`exampleAnswer: '288'`), `solver`, and `RaceVisualizer`.

## Maintainer Guide

- `Part 1` delegates race modeling, exact quadratic root bounds (`BoatRace.winningRange`), and bounded trace generation (`traceRaceSheet`) directly to `2023/day06/shared/`.
- `RaceVisualizer` is a thin wrapper around `RaceParabolaVisualizer` so Part 2 can reuse the identical quadratic curve explorer with a single-race parser.
