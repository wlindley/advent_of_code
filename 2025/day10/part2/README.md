# 2025 Day 10 Part 2 — Factory (Part Two)

## Consumer Guide

- **Module entrypoint**: `2025/day10/part2/index.ts` exports `manifest: PuzzlePartManifest`.
- **Domain API** (`2025/day10/part2/domain/index.ts`):
  - `solver`: `PuzzleSolver<readonly FactoryMachine[], number, MachineJoltageTraceFrame>` using `parseMachines` from `2025/day10/shared`.
  - `solveMachineJoltage(machine, machineIndex?)`: returns `{ machineIndex, system, presses }` minimizing `sum(presses)` subject to `A x = joltageRequirements`, `x >= 0` integer.
  - `solveFactoryJoltages(machines)`: returns total minimum button presses across all machines.
  - `traceFactoryJoltages(machines, options?)`: produces uniformly downsampled `MachineJoltageTraceFrame[]` bounded by `maxSteps` (`DEFAULT_MAX_TRACE_STEPS = 120`).
- **CLI usage**:
  - `npm run aoc -- solve 2025 10 2 <path-to-input>`

## Maintainer Guide

- **Architecture**:
  - `shared/core/rational.ts`: Immutable `Rational` arithmetic over `BigInt` (`gcdBigInt`, `lcmBigInt`, `floorDiv`, `ceilDiv`).
  - `2025/day10/part2/domain/linearSystem.ts`: Immutable `RationalLinearSystem` performing full Gauss-Jordan RREF over `Q` with configurable `pivotOrder`, preserving original column indices, and extracting exact common-denominator integer pivot & objective identities.
  - `2025/day10/part2/domain/solver.ts`: Orders widest-bounded buttons as pivots so tightly constrained buttons become free variables, then runs an exact `BigInt` branch-and-bound DFS over free variables with suffix negative slacks and objective-ordered scanning (`ascending = w >= 0n`).
  - `2025/day10/part2/viz/FactoryJoltageVisualizer.tsx`: Thin SVG + `PlaybackControls` visualizer displaying proportional counter bar gauges, button press cards, and the exact `Q`-RREF augmented matrix.
- **Invariants**:
  - `domain/` contains zero React/DOM imports and zero imports from `2025/day10/part1/`.
  - `MachineJoltageSolution` does not store derived `totalPresses`; callers compute it via `totalPresses(presses)`.
  - `solver.oracle.test.ts` cross-checks `solveMachineJoltage` against an independent parity-halving divide-and-conquer oracle.
