# `2025/day02/part1` — Gift Shop (Part 1)

## Consumer Guide
Pure solver and interactive range-band visualizer for Advent of Code 2025 Day 2 Part 1.

- **CLI Execution**: `npm run aoc -- run 2025 2 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: iterates feasible half-lengths `k` (`ceil(minDigits / 2)..floor(maxDigits / 2)`), clamps each `IdRange` to a `RepeatedPatternBand(k, 2)` via `M = 10^k + 1`, and sums closed-form `BigInt` arithmetic progressions. `trace()` emits step `0` plus stride-sampled frames capped at `DEFAULT_MAX_TRACE_STEPS` (`250`), capping per-band sample badges at `DEFAULT_MAX_BAND_SAMPLES` (`6`).
- `viz/RangeBandVisualizer.tsx`: light-mode UI displaying per-range metadata badges, `BigInt`-scaled SVG half-space clamping bars, two-tone split-half ID badges (`var(--accent)` / `var(--ok)`), and `<PlaybackControls>`.
