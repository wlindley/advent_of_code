# 2023 Day 10 Shared Domain & Visualization Primitives

## Consumer Guide

`2023/day10/shared/index.ts` exports pure TypeScript domain primitives for parsing, validating, and traversing orthogonal 2D pipe mazes (without importing or re-exporting React/DOM visualization modules):

- `pipes.ts`: Direction bitmasks (`DIR_N`, `DIR_E`, `DIR_S`, `DIR_W`, `DIR_BITS`), `GridCoord` (`createCoord`), symbol parsing (`parsePipeSymbol`), bitmask/port utilities (`oppositeBit`, `bitToDirIndex`, `tileMask`, `pipePorts`, `maskToPipeShape`, `otherPort`).
- `maze.ts`: `PipeMaze` and `parsePipeMaze(raw)` wrapping `Grid2D<PipeSymbol>`, inferring the start tile shape `'S'` from reciprocal neighbor connections, and exposing `stepFrom(coord, dirBit)`.
- `loop.ts`: `MainLoop` and `traceMainLoop(maze)` walking the unique degree-2 cycle from `S` in $O(L)$ time and providing $O(1)$ per-cell membership (`isOnLoop`), cycle index (`cycleIndexAt`), and shortest loop distance (`distanceAt`), plus derived getters `length`, `farthestDistance`, and `farthestCoord`.
- `trace.ts`: `buildLoopWalkTrace(loop, options)` producing up to `DEFAULT_MAX_TRACE_STEPS` (`120`) sampled `PipeMazeTraceFrame` snapshots for dual-wavefront playback.

`2023/day10/shared/viz/` provides dual-mode visualization components (`PipeMazeCanvas`, `PipeMazeSvg`, `PipeMazeHiDpiCanvas`, and `palette.ts`) shared across Part 1 and Part 2.

## Maintainer Notes

- **Module DAG**: `pipes.ts` -> `maze.ts` -> `loop.ts` -> `trace.ts` -> `index.ts`. `shared/viz/*` depends on `shared/index.ts` and never vice versa.
- **Invariants**:
  - `PipeMaze` guarantees a unique `'S'` with exact degree 2.
  - Because every non-`'S'` pipe has degree $\le 2$ and `'S'` has degree 2, `traceMainLoop` can only hit a dead end (`stepFrom === null`) or return cleanly to `'S'` via its second port.
  - `MainLoop` enforces `rows > 0`, `cols > 0`, even `length >= 4`, in-bounds coordinates, and vertex uniqueness in its constructor, deriving `length`, `farthestDistance`, and `farthestCoord` without stored derived state. Its private `Int32Array` lookup table is intentionally left unfrozen (`Object.freeze` throws on TypedArrays).
