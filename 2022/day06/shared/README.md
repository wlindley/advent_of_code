# 2022 Day 6 Shared Domain (`2022/day06/shared`)

Pure TypeScript domain and visualization primitives for Advent of Code 2022 Day 6 ("Tuning Trouble"), parameterized by distinct-character window size `K` (`4` for Part 1, `14` for Part 2).

## Consumer Interface

- `DatastreamBuffer` & `parseDatastream(raw)`: validates a single-line, non-empty lowercase ASCII signal (`^[a-z]+$`).
- `findMarkerPosition(buffer, windowSize)`: returns the 1-based end position of the first `windowSize`-character substring with all distinct letters (`RangeError` on invalid size, short stream, or missing marker).
- `traceMarkerSearch(buffer, windowSize, options?)`: generates frozen `MarkerTraceFrame` snapshots uniformly sampled up to `maxSteps` (default `120`).
- `createMarkerSolver(windowSize)`: returns a frozen `MarkerSolver` implementing `PuzzleSolver<DatastreamBuffer, number, MarkerTraceFrame>`.
- `shared/viz/SignalTapeVisualizer`: reusable interactive tape + 26-letter register SVG visualizer (imported directly from `./viz/SignalTapeVisualizer`, never re-exported from `shared/index.ts`).

## Maintainer Architecture

- **DAG**: `buffer.ts` -> `marker.ts` -> `trace.ts` -> `index.ts` (pure TS); `viz/SignalTapeSvg.tsx` -> `viz/SignalTapeVisualizer.tsx` (React/SVG).
- **Algorithm**: Single-pass `Int32Array(26)` monotonic jump window (`if (prev >= start) start = prev + 1`), achieving `O(N)` time and `O(1)` auxiliary space without backtracking or hash allocations.
- **Invariants**: `MarkerTraceFrame` stores primary step data only; `windowStart`, `windowLength`, `windowText`, `currentChar`, `position`, `hasCollision`, `jumpDistance`, and `isMarkerFound` are computed dynamically via getters.
