# `2019/day07/shared` — Amplifier Circuit Engine & Visualization Primitives

## Consumer Guide
Pure TypeScript amplification-circuit solver, circuit mode strategies, and interactive visualizer components for AoC 2019 Day 7.

- `index.ts`: pure TS barrel exporting `AmplifierCircuitSolver`, `SERIES_CIRCUIT_MODE`, `FEEDBACK_LOOP_MODE`, `AmplifierStage`, `generatePermutations`, domain models (`StageTelemetry`, `CircuitRunResult`, `AmplifierSearchResult`, `AmplifierTraceFrame`), and `vizLayout` helpers. Zero React/DOM or `viz/` imports.
- `viz/AmplifierVisualizer.tsx`, `viz/AmplifierChainSvg.tsx`, `viz/LeaderboardPanel.tsx`: interactive light-mode amplifier schematic and leaderboard explorer.

## Maintainer Guide
- `permutations.ts`: iterative Narayana lexicographic permutation generator returning frozen tuples (handles empty, singleton, unsorted, and duplicate inputs).
- `amplifierStage.ts`: wraps `IntcodeMachine` with `BufferedIoChannel([phase])` and an output cursor (`emittedCursor`) for incremental output draining. `IntcodeMachine.run(maxSteps)` enforces a cumulative lifetime step budget across pause/resume calls.
- `circuitModes.ts`: strategy implementations for `SERIES_CIRCUIT_MODE` (0..4, single pass) and `FEEDBACK_LOOP_MODE` (5..9, E -> A feedback rounds with deadlock detection).
- `amplifierSolver.ts`: `AmplifierCircuitSolver` implementing `Required<PuzzleSolver<IntcodeProgram, bigint, AmplifierTraceFrame>>` with bounded `trace` sampling (`DEFAULT_MAX_TRACE_FRAMES = 120`) and running top-5 leaderboard.
- `vizLayout.ts`: deterministic `860 x 250` SVG schematic geometry, pure BigInt signal formatting, and BigInt fixed-point ratio normalization.
