# 2021 Day 21 Part 1

## Consumer Usage
- **Domain entrypoint**: `part1/domain/index.ts` exports `solver` (`parse`, `solve`, `trace`) for the deterministic 100-sided practice game (`targetScore = 1000`).
- **Site manifest**: `part1/index.ts` exports `manifest` for the `2021/day21/part1` runner and interactive track visualizer.

## Developer Notes
- Delegates parsing, turn simulation, and trace sampling to `2021/day21/shared` (`parseDiracDice`, `solveDeterministicGame`, `traceDeterministicGame`).
- `Part1Visualizer` renders telemetry badges, score progress bars, `PlaybackControls`, and the shared `DiracTrackSvg` ring overlay.
