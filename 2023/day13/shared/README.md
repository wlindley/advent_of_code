# Day 13 Shared Domain (`2023/day13/shared`)

## Consumer Guide

Pure TypeScript module providing mirror-pattern parsing, BigInt bitmask reflection detection, bounded trace generation, and solver creation for AoC 2023 Day 13 (Point of Incidence):

- `MirrorPattern` / `parseMirrorPatterns(raw)`: parses blank-line-delimited rectangular `[.#]+` grids into frozen `MirrorPattern` value objects with `encodeRowMasks()` and `encodeColMasks()`.
- `ReflectionMatch` / `findReflection(pattern, targetSmudges)`: finds the unique vertical or horizontal axis with exactly `targetSmudges` mirrored cell mismatches, exposing `score`, `smudgeCount`, `mismatches`, and `mirrorOf(row, col, pattern)`.
- `summarizePatterns(patterns, targetSmudges)`: sums `score` across all patterns after validating `targetSmudges`.
- `buildIncidenceTrace(patterns, targetSmudges, options?)`: computes matches across all patterns and returns uniformly sampled `IncidenceTraceFrame` snapshots capped by `maxSteps` (`DEFAULT_MAX_TRACE_STEPS = 100`).
- `createIncidenceSolver(targetSmudges)`: returns a frozen `PuzzleSolver` configured for Part 1 (`0` smudges) or Part 2 (`1` smudge).

Note: `shared/index.ts` is strictly pure TS and never imports or re-exports anything from `shared/viz/`.

## Maintainer Architecture

- `pattern.ts`: immutable `MirrorPattern` (`Object.freeze`) with dynamic `height`/`width` getters, bounds-checked `cell(row, col)`, and BigInt row/column mask encoders safe past 64 bits.
- `reflection.ts`: XOR + `bitCount` axis scanner with early `limit` pruning and lowest-set-bit (`xor & -xor`) mismatch extraction.
- `trace.ts`: delegates index sampling to `shared/core`'s `sampleTraceIndices` and `validateMaxSteps`.
- `viz/` (`.tsx` only): `IncidenceVisualizer.tsx` and `MirrorGridSvg.tsx` consume `shared/index.ts` and `shared/viz/` playback primitives.
