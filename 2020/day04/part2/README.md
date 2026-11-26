# 2020 Day 4 Part 2 — Passport Processing

## User / Consumer
- Exports `manifest: PuzzlePartManifest` (`./index.ts`) and `solver: PuzzleSolver<PassportBatch, number, PassportTraceFrame>` (`./domain/index.ts`).
- `solver.parse(raw)` parses blank-line-separated passport blocks; `solver.solve(batch)` counts passports whose seven required fields (`byr`, `iyr`, `eyr`, `hgt`, `hcl`, `ecl`, `pid`) are present and satisfy strict format/range validation, treating `cid` as optional.

## Developer / Maintainer
- Thin adapter over `../../shared` (`STRICT_FIELD_POLICY`, `countValidPassports`, `tracePassportScan`).
- `PassportProcessingPart2Visualizer` renders `PassportScanVisualizer` with `STRICT_FIELD_POLICY` and bounded `PlaybackControls`.
