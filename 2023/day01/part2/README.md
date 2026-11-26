# `2023/day01/part2` — Trebuchet?! (Part 2)

## Consumer Guide
Pure TypeScript solver and interactive spelled-digit calibration visualizer for Advent of Code 2023 Day 1 Part 2.

- **CLI Execution**: `npm run aoc -- run 2023 1 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/spelledDigitExtractor.ts`: implements `DigitExtractor` for ASCII `'0'..'9'` (`48..57`) and spelled English words `'one'..'nine'` (explicitly excluding `'zero'`), using a first-character bucketed lookup map for `O(1)` candidate filtering at every position (preserving overlapping matches like `twone` and `oneight`).
- `domain/solver.ts`: delegates `parse` to `CalibrationDocument.parse`, `solve` to `document.calibrate(spelledDigitExtractor)`, and `trace` to `document.trace(spelledDigitExtractor, options)` (defaulting to `200` sampled frames).
- `viz/SpelledCalibrationVisualizer.tsx`: light-mode interactive scanner partitioning disjoint, reused single (`--gold`), and overlapping (`--accent` / `--gold` bridge / `--ok`) spans without duplicating characters, alongside decoded token and running-sum telemetry, a 6-frame history strip, and `<PlaybackControls>`.
