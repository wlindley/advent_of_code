# `2025/day02/part2` — Gift Shop (Part 2)

## Consumer Guide
Pure solver and interactive inclusion-exclusion band visualizer for Advent of Code 2025 Day 2 Part 2.

- **CLI Execution**: `npm run aoc -- run 2025 2 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: for each feasible digit length `L` (`max(2, minDigits)..maxDigits`), `squarefreeRepeatTerms(L)` enumerates non-empty squarefree prime subsets of `L` with alternating Möbius inclusion-exclusion signs (`+1n` / `-1n`). Each term clamps `IdRange` onto `RepeatedPatternBand(patternLength, repeats)` in `O(1)` `BigInt` arithmetic, avoiding double-counting multi-period numbers (such as `222222` or `121212`). `trace()` caps output at `DEFAULT_MAX_TRACE_STEPS` (`250`) frames and `DEFAULT_MAX_BAND_SAMPLES` (`6`) samples per band.
- `viz/InclusionBandVisualizer.tsx`: light-mode UI displaying per-range net totals, Möbius `+add − sub = net` reconciliation badges, `BigInt`-scaled SVG clamping bars colored by sign (`var(--accent)` / `var(--err)`), segmented periodic pattern previews, and `<PlaybackControls>`.
