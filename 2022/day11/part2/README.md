# 2022 Day 11 Part 2 — Monkey in the Middle

## Consumer Guide (`2022/day11/part2`)

- `manifest`: `PuzzlePartManifest` auto-discovered by `site/registry.ts` for interactive playback and solution checking.
- `domain/index.ts`: exports `PART2_ROUNDS` (`10_000`), `ModularReliefRule`, `PART2_RULE`, and `solver` (`PuzzleSolver<KeepAwaySetup, bigint, KeepAwayTraceFrame>`).
- `viz/MonkeyInTheMiddlePart2Visualizer.tsx`: renders `KeepAwayVisualizer` configured with `PART2_RULE`.

## Maintainer Architecture

- `domain/rule.ts` defines the frozen `ModularReliefRule` implementing `KeepAwayRule` via `worry % commonModulus` over 10,000 rounds, validating `worry >= 0n` and `commonModulus > 0n`.
- All parsing, trajectory simulation, trace sampling (bounded to 200 frames by default), and UI components are delegated to `2022/day11/shared/` with zero dependency on `part1/`.
- Differential oracle tests in `domain/solver.oracle.test.ts` cross-check `solver` against both a no-LCM per-divisor residue vector oracle (`∏ ℤ/d_kℤ`) and a synchronous FIFO queue oracle across the official example, composite/shared-factor divisors, and 50 seeded random monkey graphs.
