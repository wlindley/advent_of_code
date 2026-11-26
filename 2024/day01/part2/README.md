# `2024/day01/part2` — Historian Hysteria (Part 2)

## Consumer Guide
Pure solver and interactive similarity-score visualization for Advent of Code 2024 Day 1 Part 2.

- **CLI Execution**: `npm run aoc -- run 2024 1 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: builds a `ReadonlyMap<number, number>` of right-column frequencies via `buildRightFrequencies`, then scans the left column and sums `BigInt(locationId) * BigInt(rightCount)` to prevent safe-integer overflow on large inputs. `traceSimilarityScore` samples up to `DEFAULT_MAX_TRACE_STEPS` (`200`) frames via `sampleTraceIndices` and allocates `LocationMatch` snapshots only on sampled frames.
- `viz/SimilarityScoreVisualizer.tsx`: uses `usePlayback` and `<PlaybackControls>` to step through a windowed left-scan match table alongside a `BigInt`-safe cumulative score curve.
