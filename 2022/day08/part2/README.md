# 2022 Day 8 Part 2 — Treetop Tree House (`2022/day08/part2`)

Finds the maximum scenic score (`U * R * D * L` viewing-distance product) across a rectangular tree-height grid (`0..9`).

## Consumer Interface

- `domain/scenic.ts`: exports `DEFAULT_MAX_TRACE_STEPS` (`120`), `ScenicScanTimeline`, `ScenicTraceFrame`, `findMaxScenicScore`, and `traceScenicScore`.
- `domain/solver.ts`: exports `solver` (`ScenicScoreSolver` implementing `PuzzleSolver<ForestGrid, number, ScenicTraceFrame>`).
- `index.ts`: exports `manifest` (`PuzzlePartManifest`) with the 5×5 official `exampleInput`, `exampleAnswer` (`"8"`), `solver`, and `ScenicScoreVisualizer`.
- `viz/ScenicScoreVisualizer.tsx`: interactive row-major champion scanner with Scanned/Ridges highlight toggle, click-to-pin tree sightlines, and live `U × R × D × L = score` readout over `CanopySightlineSvg`.

## Maintainer Architecture

- **Thin Part Layer**: `part2/domain` delegates grid parsing (`ForestGrid`) and 4-pass monotonic-stack viewing-distance computation (`ForestSightlines`) to `2022/day08/shared`, computing only the row-major champion progression in `ScenicScanTimeline` with zero stored derived state on `ScenicTraceFrame`.
- **Bounded Visualization**: `traceScenicScore` samples at most `120` row-scan frames so large grids render smoothly over `CanopySightlineSvg`.
