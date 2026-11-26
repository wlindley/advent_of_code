# AoC 2023 Day 16 Part 1 — The Floor Will Be Lava

## Consumer Guide

- **Domain entrypoint**: `2023/day16/part1/domain` exports `PART1_ENTRY` (`(0, 0)` heading East) and `solver` (`PuzzleSolver<Contraption, number, BeamWaveFrame>`).
- **Web manifest**: `2023/day16/part1/index.ts` exports `manifest` for auto-discovery by `site/registry.ts`.
- **Visualizer**: `LavaPart1Visualizer` renders telemetry badges (`Grid`, `Entry`, `Wave`, `Frontier`, `Energized`), a HiDPI `<ContraptionCanvas />`, legend, and `PlaybackControls`.

## Maintainer Architecture

- `domain/solver.ts`: Delegates parsing to `parseContraption`, solving to `BeamTracer.countEnergized(PART1_ENTRY)`, and wavefront tracing to `BeamTracer.traceWaves(PART1_ENTRY, options)`.
- `viz/LavaPart1Visualizer.tsx`: Samples at most `DEFAULT_MAX_TRACE_STEPS` (`120`) frames so large contraption grids remain responsive during playback.
- `domain/solver.test.ts`: Verifies `PART1_ENTRY`, `\` entry-tile reflection at `(0, 0)`, trace endpoint consistency, and `executeSolver` with a deterministic fake `Clock`.
