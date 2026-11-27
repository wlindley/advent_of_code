# 2021 Day 20 Part 1

## Consumer Usage
- **Domain entrypoint**: `part1/domain/index.ts` exports `solver` (`TrenchMapSolver` configured with `PART1_POLICY`, `steps = 2`).
- **Site manifest**: `part1/index.ts` exports `manifest` for the `2021/day20/part1` visualizer and runner.

## Developer Notes
- Delegates all parsing, enhancement, void parity tracking, and tracing to `2021/day20/shared`.
- `Part1Visualizer` binds `solver` to the shared `TrenchMapVisualizer` canvas component.
