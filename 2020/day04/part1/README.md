# 2020 Day 4 Part 1 — Passport Processing

## User / Consumer
- Exports `manifest: PuzzlePartManifest` (`./index.ts`) and `solver: PuzzleSolver<PassportBatch, number, PassportTraceFrame>` (`./domain/index.ts`).
- `solver.parse(raw)` parses blank-line-separated passport blocks; `solver.solve(batch)` counts passports with all seven required fields (`byr`, `iyr`, `eyr`, `hgt`, `hcl`, `ecl`, `pid`), treating `cid` as optional.

## Developer / Maintainer
- Thin adapter over `../../shared` (`PRESENCE_POLICY`, `countValidPassports`, `tracePassportScan`).
- `PassportProcessingPart1Visualizer` renders `PassportScanVisualizer` with `PRESENCE_POLICY` and bounded `PlaybackControls`.
