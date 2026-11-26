# `2024/day08/shared` — Resonant Collinearity Core Domain & Viz Primitives

## Consumer Guide
Pure TypeScript domain primitives for Advent of Code 2024 Day 8 ("Resonant Collinearity"):

- `map.ts`: `GridPoint`, `AntennaMap`, `parseAntennaMap(raw)`, `EMPTY_CELL`, and `CELL_CHAR_PATTERN`.
- `resonance.ts`: `AntinodeProjectionRule` strategy interface, `ResonanceTraceFrame`, `collectAntinodes`, and bounded `traceAntinodes`.
- `index.ts`: Pure TypeScript barrel (never imports React/DOM or `./viz/*` so CLI and tests stay Node-pure).
- `viz/`: Deterministic `palette.ts` and React SVG components (`ResonanceGridSvg.tsx`, `ResonanceVisualizer.tsx`).

## Maintainer Guide
- **Coordinate Purity**: `GridPoint` accepts any integer `(row, col)` so out-of-bounds projections can be represented for visualization, while `AntennaMap` validates all cells against `[.0-9A-Za-z]` and computes `frequencyGroups` and `totalPairs` dynamically from `grid`.
- **Rule Validation & Exact Traces**: `collectAntinodes` and `traceAntinodes` use a local non-frozen `Uint8Array` bitset, throw `RangeError` if any rule returns an out-of-bounds point in `inBounds`, and apply `recordInBounds` to every pair so sampled frames retain exact `cumulativeAntinodes` and `uniqueCount`.
