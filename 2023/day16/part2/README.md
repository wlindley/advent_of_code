# AoC 2023 Day 16 Part 2 — The Floor Will Be Lava

## Consumer Guide

- **Domain entrypoint**: `2023/day16/part2/domain` exports `PerimeterScanResult`, `scanPerimeter`, `traceOptimalPerimeter`, `OptimalPerimeterTrace`, and `solver` (`PuzzleSolver<Contraption, number, BeamWaveFrame>`).
- **Web manifest**: `2023/day16/part2/index.ts` exports `manifest` (`PuzzlePartManifest`) for auto-discovery by `site/registry.ts`.
- **Visualizer**: `LavaPart2Visualizer` displays grid/perimeter telemetry badges (`Grid`, `Entries`, `Best`, `Wave`, `Frontier`, `Energized`), a HiDPI `<ContraptionCanvas />` with perimeter score heatmap and optimal entry marker, legend, and `PlaybackControls`.

## Maintainer Architecture

- `domain/perimeterScan.ts`:
  - `PerimeterScanResult` freezes defensive copies of every `EdgeBeamScore` (validating positive integer counts and non-empty lists) and computes `.best` dynamically via `>` tie-breaking in scan order (no stored derived state).
  - `scanPerimeter` and `traceOptimalPerimeter` share `scanWithTracer` over one reusable `BeamTracer` instance so typed buffers (`visited`, `queue`) are allocated once per contraption.
- `domain/solver.ts`: Delegates parsing to `parseContraption`, solving to `scanPerimeter(contraption).best.energizedCount`, and tracing to `traceOptimalPerimeter(contraption, options).frames`.
- `viz/LavaPart2Visualizer.tsx`: Caps trace playback at `DEFAULT_MAX_TRACE_STEPS` (`120`) frames so large grids stay responsive.
