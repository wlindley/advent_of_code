# 2023 Day 06 Part 2 — Wait For It

## Consumer Guide

- **Domain entrypoint** ([domain/index.ts](domain/index.ts)): exports `parseMergedRace`, `solveMergedRace`, and `solver` (`parse`, `solve`, `trace`).
- **Site manifest** ([index.ts](index.ts)): registers Part 2 metadata, official kerning-fixed example (`exampleAnswer: '71503'`), `solver`, and `RaceVisualizer`.

## Maintainer Guide

- `parseMergedRace` reuses `extractRaceRows` and `parseUnsignedBigInt` from [../../shared](../../shared/index.ts), stripping internal whitespace (`\s+`) before constructing a single-race `RaceSheet`.
- Solving (`BoatRace.waysToWin`), trace snapshots (`traceRaceSheet`), and parabolic visualization (`RaceParabolaVisualizer`) are delegated to `2023/day06/shared/`.
