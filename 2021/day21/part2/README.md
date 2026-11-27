# 2021 Day 21 Part 2

## Consumer Usage
- **Domain entrypoint**: `part2/domain/index.ts` exports `solver` (`parse`, `solve`, `trace`) for quantum 3-sided Dirac Dice (`targetScore = 21`, returning `bigint`).
- **Site manifest**: `part2/index.ts` exports `manifest` for the `2021/day21/part2` runner and quantum multiverse visualizer.

## Developer Notes
- Delegates parsing, BigInt wavefront propagation, and trace sampling to `2021/day21/shared` (`parseDiracDice`, `solveQuantumGame`, `traceQuantumGame`).
- `Part2Visualizer` renders quantum telemetry badges, `PlaybackControls`, log2-scaled `QuantumWinBars`, and the shared `DiracTrackSvg` quantum halo overlay.
