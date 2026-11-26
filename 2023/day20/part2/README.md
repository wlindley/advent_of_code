# AoC 2023 Day 20 Part 2 — Pulse Propagation

## Consumer Guide

- **Domain entrypoint**: `2023/day20/part2/domain` exports `solver` (`PuzzleSolver<CircuitBlueprint, bigint, PulseTraceFrame>`), `TARGET_MODULE` (`'rx'`), `MAX_CYCLE_SEARCH_PRESSES` (`100_000`), `findMinPressesForRx`, `FeederCycleTracker`, `Part2TraceRecorder`, and `NOOP_OBSERVER`.
- **Web manifest**: `2023/day20/part2/index.ts` exports `manifest` for auto-discovery by `site/registry.ts` with a documented 2-counter `(5, 7)` example (`exampleAnswer: '35'`).
- **Visualizer**: `PulsePart2Visualizer` delegates to `2023/day20/shared/viz/PulseCircuitVisualizer.tsx` with `partLabel="Part 2 (Low Pulse to rx)"`, rendering milestone cycle-detection frames and `PlaybackControls`.

## Maintainer Architecture

- `domain/cycles.ts`: `FeederCycleTracker` validates single-conjunction feeder topology (`>= 2` inputs), tracks first/second high pulses per feeder input, enforces exact zero-phase periodicity (`period === firstPress`), and folds verified periods with `lcmBigInt`.
- `domain/trace.ts`: Defines the polymorphic `RxSearchObserver` interface, `NOOP_OBSERVER`, and `Part2TraceRecorder` (captures frozen milestone `PulseTraceFrame`s and bounds output via `sampleTraceIndices`).
- `domain/solver.ts`: `runRxSearch` drives `CircuitSimulator` press-by-press via `runSinglePress`, returning immediately on a direct low pulse to `rx` or once all feeder cycles are verified.
- `domain/*.test.ts`: Brute-force `CircuitSimulator` differential oracle across multi-counter LCM cases, direct/non-aggregator topologies, zero-phase violation errors, bounded traces, and 100% V8 coverage.
