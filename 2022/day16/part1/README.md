# 2022 Day 16 Part 1 — Proboscidea Volcanium

## Consumer Guide
- **Domain entry**: `./domain/index.ts` exports `solver` and `PART1_TIME_LIMIT = 30`.
- **Site manifest**: `./index.ts` exports `manifest: PuzzlePartManifest` wired to `ValvePressureVisualizer` and the 10-valve example (`1651`).
- **CLI execution**: `solver` in `./domain/solver.ts` implements `PuzzleSolver<ValveNetwork, number, ValveTimelineFrame>`.

## Maintainer Notes
- **Algorithm**: `solver.solve` compresses the parsed `ValveNetwork` into `CompressedValveNetwork` and runs `findOptimalSchedule(compressed, 30)`.
- **Trace**: `solver.trace` delegates to `buildValveTimeline(compressed, [{ label: 'You', schedule }], 30, options)` bounded by `DEFAULT_MAX_TRACE_STEPS` (`64`).
- **Visualization**: `ValvePressureVisualizer.tsx` renders KPI badges, `ValveNetworkSvg`, legend, and `PlaybackControls` directly inside `<div className="stack">`.
