# 2022 Day 11 Part 1 — Monkey in the Middle

## Consumer Guide (`2022/day11/part1`)

- `manifest`: `PuzzlePartManifest` consumed by `site/registry.ts` for interactive playback and solution checking.
- `domain/index.ts`: exports `PART1_ROUNDS` (`20`), `DivideByThreeRule`, `PART1_RULE`, and `solver` (`PuzzleSolver<KeepAwaySetup, bigint, KeepAwayTraceFrame>`).
- `viz/MonkeyInTheMiddlePart1Visualizer.tsx`: renders `KeepAwayVisualizer` configured with `PART1_RULE`.

## Maintainer Architecture

- `domain/rule.ts` defines the frozen `DivideByThreeRule` implementing `KeepAwayRule` via `floorDiv(worry, 3n)` over 20 rounds.
- All parsing, trajectory simulation, trace sampling, and UI components are delegated to `2022/day11/shared/` so Part 2 can plug in a modular-relief rule without duplicating code.
- Oracle tests in `domain/solver.oracle.test.ts` cross-check the trajectory solver against an independent FIFO queue simulation across the example, Part 2 modular relief, and 80 seeded random monkey graphs.
