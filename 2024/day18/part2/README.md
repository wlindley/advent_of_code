# 2024 Day 18 — Part 2: RAM Run

## Consumer Guide

- **Exports (`2024/day18/part2/index.ts`)**: `manifest` (`PuzzlePartManifest` with `exampleInput`, `exampleAnswer: '6,1'`, `solver`, and `Visualizer`).
- **Domain API (`2024/day18/part2/domain/index.ts`)**:
  - `BlockingByteResult`: frozen value object holding `byte`, `byteIndex`, and dynamic getters `fallenCount` and `coordinate` (`"x,y"`).
  - `findBlockingByte(memory)`: returns `BlockingByteResult | null` for the earliest byte disconnecting `(0, 0)` from `(S - 1, S - 1)`.
  - `requireBlockingByte(memory)`: returns `BlockingByteResult` or throws if the exit stays reachable.
  - `buildBlockingByteTrace(memory, options?)`: builds an endpoint-preserving `RamRunSnapshot[]` animation capped by `options.maxSteps` (default `80`).
  - `solvePart2(memory)`, `createRamRunPart2Solver(gridSize)`, and default `solver` (`71×71` grid for `tools/aoc/cli.ts`).

## Maintainer Notes

- **Reverse-Time DSU Algorithm**: `findBlockingByte` copies `memory.copyFirstFallIndices()`, initializes a `DisjointSet` over `S^2` cells, opens all cells with `NEVER_CORRUPTED`, and rewinds byte index `k` downward from `memory.byteCount`. Only when `firstFall[idx] === k` (the cell's earliest corruption timestamp) is the cell reopened and unioned with open 4-neighbors, avoiding premature reopening on duplicate coordinates.
- **Termination Invariant**: Because `S >= 1`, at `k === 0` every cell in the grid is open and connected, so the `while (!isEndpointsConnected(...))` loop is guaranteed to terminate without an explicit `k > 0` check.
- **Module Boundaries**: Zero edits to `shared/` or `2024/day18/shared/`, and zero imports from `2024/day18/part1/`. All domain modules are pure TypeScript; React/Canvas rendering is isolated in `viz/RamRunPart2Visualizer.tsx`.
