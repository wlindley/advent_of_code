# `2024/day02/part2` — Red-Nosed Reports: Problem Dampener (Part 2)

## Consumer Guide
Pure solver and interactive Problem Dampener visualization for Advent of Code 2024 Day 2 Part 2.

- **CLI Execution**: `npm run aoc -- run 2024 2 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/dampener.ts`: `DampenerEvaluation` evaluates each `Report` using `firstFailure()`. When a failure occurs at index `i`, only `{0, 1, 2}` (when `i === 1`) or `{i, i + 1}` (otherwise) can resolve it, tested via zero-allocation `isSafeSkipping`. Outcomes are frozen and trend flips (`didTrendFlip`) and `dampenedTrend` are computed dynamically via getters.
- `domain/solver.ts`: counts safe reports (`countDampenedSafeReports`) and emits bounded `DampenerTraceFrame` snapshots via `TraceFrameSnapshot` sampled up to `DEFAULT_MAX_TRACE_STEPS` (`200`).
- `viz/DampenedProfileSvg.tsx` & `viz/ProblemDampenerVisualizer.tsx`: renders struck-through removed nodes, dashed quadratic Bézier bypass bridges, trend-flip callouts, KPI counters, a 5-row scan window, and a 72-bar overview strip controlled by `usePlayback` and `<PlaybackControls>`.
