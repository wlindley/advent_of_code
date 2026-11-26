# 2024 Day 18 Part 1 — RAM Run

## Consumer Guide

- **Manifest**: `./index.ts` exports `manifest: PuzzlePartManifest` for automatic site registry discovery, selecting `EXAMPLE_RAM_RUN_CONFIG` (`7×7 / 12`) for the official example input and `DEFAULT_RAM_RUN_CONFIG` (`71×71 / 1024`) otherwise.
- **CLI / Domain Solver**: `./domain/solver.ts` exports `solver` (`PuzzleSolver<MemorySpace, number, RamRunSnapshot>`) parameterized with `DEFAULT_RAM_RUN_CONFIG` (`71×71 / 1024`) for `tools/aoc/cli.ts`.
- **Visualizer**: `./viz/RamRunPart1Visualizer.tsx` renders an animated corruption + BFS wave + shortest-path playback using `RamRunCanvas` and `PlaybackControls`.

## Maintainer Guide

- **Architecture**: `part1/domain/` validates `RamRunConfig`, delegates coordinate parsing, `Int32Array` BFS, and bounded trace generation (`DEFAULT_MAX_TRACE_STEPS = 80`) to `../../shared`, and throws if the exit is unreachable.
- **Verification**: Unit tests validate `solvePart1`, `createRamRunPart1Solver`, `executeSolver`, and trace capping; `../../shared/bfs.oracle.test.ts` cross-checks BFS distances, paths, and reachability against independent `Set<string>` BFS and reverse-time `DisjointSet` oracles.
