# 2021 Day 20 Part 2

## Consumer Usage
- **Domain entrypoint**: `part2/domain/index.ts` exports `solver` (`TrenchMapSolver` configured with `PART2_POLICY`, `steps = 50`).
- **Site manifest**: `part2/index.ts` exports `manifest` for the `2021/day20/part2` visualizer and runner.

## Developer Notes
- Delegates all parsing, 50-pass enhancement, void parity tracking, and 51-frame tracing to `2021/day20/shared`.
- `Part2Visualizer` binds `solver` to the shared `TrenchMapVisualizer` canvas component.
