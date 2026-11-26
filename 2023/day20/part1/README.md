# AoC 2023 Day 20 Part 1 — Pulse Propagation

## Consumer Guide

- **Domain entrypoint**: `2023/day20/part1/domain` exports `solver` (`PuzzleSolver<CircuitBlueprint, bigint, PulseTraceFrame>`), `PART1_BUTTON_PRESSES` (`1000`), and `PART1_TRACE_PRESSES` (`4`).
- **Web manifest**: `2023/day20/part1/index.ts` exports `manifest` for auto-discovery by `site/registry.ts`.
- **Visualizer**: `PulsePart1Visualizer` renders telemetry badges (`Frame`, `Press`, `Low`, `High`, `Answer`), the active pulse banner, a layered left-to-right SVG circuit diagram (`PulseCircuitSvg`), and `PlaybackControls`.

## Maintainer Architecture

- `domain/solver.ts`: Parses module definitions via `parseCircuitBlueprint`, executes `1000` presses on `CircuitSimulator` returning `simulator.product`, and delegates `trace()` to `buildPulseTrace` (`4` presses, capped to `200` frames).
- `viz/PulsePart1Visualizer.tsx`: Thin wrapper delegating to `2023/day20/shared/viz/PulseCircuitVisualizer.tsx`.
- `domain/solver.test.ts`: Verifies Example 1 (`32000000n`) and Example 2 (`11687500n`) via `executeSolver` with a fake `Clock`, bounded trace sampling, and malformed input rejection.
