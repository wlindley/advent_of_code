# `2019/day02/part2` — 1202 Program Alarm (Part 2)

## Consumer Guide
Pure TypeScript solver and interactive search-landscape + tape visualizer for Advent of Code 2019 Day 2 Part 2.

- **CLI Execution**: `npm run aoc -- run 2019 2 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Exports**: `solver`, `findGravityAssistMatch`, `buildSearchHeatmap`, and `PART2_SEARCH_CONFIG` in `domain/index.ts`.

## Maintainer Guide
- `domain/search.ts`: 3-point basis probing `(0,0)`, `(1,0)`, `(0,1)` with cached `EvaluationTracker` and verified affine solving plus exhaustive fallback.
- `domain/heatmap.ts`: bounded BigInt-safe sampled grid and normalized `computeLogError` (`bigintLog2`) encapsulated in `SearchHeatmap`.
- `domain/solver.ts`: binds `PART2_SEARCH_CONFIG` to `PuzzleSolver` (`parse`, `solve`, bounded `trace`).
- `viz/SearchHeatmapPanel.tsx` & `viz/Visualizer.tsx`: HiDPI light-mode log-error canvas, basis probe table, reused `<TapeGridPanel>`, and `<PlaybackControls>`.
