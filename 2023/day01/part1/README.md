# `2023/day01/part1` — Trebuchet?! (Part 1)

## Consumer Guide
Pure TypeScript solver and interactive calibration scanner visualization for Advent of Code 2023 Day 1 Part 1.

- **CLI Execution**: `npm run aoc -- run 2023 1 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/asciiDigitExtractor.ts`: implements `DigitExtractor` for single ASCII `'0'..'9'` characters (`48..57`).
- `domain/solver.ts`: delegates `parse` to `CalibrationDocument.parse`, `solve` to `document.calibrate(asciiDigitExtractor)`, and `trace` to `document.trace(asciiDigitExtractor, options)` (defaulting to `200` sampled frames).
- `viz/CalibrationScannerVisualizer.tsx`: light-mode interactive scanner highlighting first (`--accent`), last (`--ok`), or reused single (`--gold`) digits alongside cumulative sum telemetry, a clickable sampled-line window, and `<PlaybackControls>`.
