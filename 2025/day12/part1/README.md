# 2025 Day 12 Part 1: Christmas Tree Farm

## User / Consumer Documentation
- **Domain entrypoint**: `2025/day12/part1/domain/index.ts` exports `solver` (`PuzzleSolver<TreeFarm, number, FarmTraceFrame>`), `solveTreeFarm`, `traceTreeFarm`, `evaluateRegion`, and `DEFAULT_MAX_TRACE_STEPS` (`120`).
- **UI manifest**: `2025/day12/part1/index.ts` registers `manifest` (`PuzzlePartManifest`) for automatic discovery by `site/registry.ts`.
- **Visualizer**: `TreeFarmVisualizer` displays region dimensions, fast-path vs. exact verdicts, a shape catalog strip, SVG polyomino packings (one inset `<path>` per piece), infeasibility diagnostics, and `PlaybackControls`.

## Developer / Maintainer Documentation
- **Two-Stage Packing (`packer.ts`)**:
  1. **Fast-Path Bounds**: Immediately classifies `trivial-empty`, `area-impossible`, `dimension-impossible`, and `disjoint-tiling` (using max short/long bounding boxes in both orientations) in $O(S)$ per region without searching.
  2. **Exact Column-Scanline Bitboard DFS**: Transposes tall regions so `rows <= cols`, precomputes valid `BigInt` placement masks anchored at `(anchorRow, 0)` per active shape and row, and explores column-by-column with slack skips and `deadStates` memoization at `row === 0`.
- **Bounded Tracing (`solver.ts`)**: Computes exact verdicts across all regions (`buildWitness: false` for unsampled regions) while constructing placement witnesses only for up to `maxSteps` sampled regions (always ending on the final region).
