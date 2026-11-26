# AoC 2023 Day 18 Part 2 — Lavaduct Lagoon

## Consumer Guide

- **Domain entrypoint**: `2023/day18/part2/domain` exports `solver` (`PuzzleSolver<LagoonPolygon, bigint, LagoonTraceFrame>`), `decodeHexCode`, `HEX_DIRECTION_CODES`, and `HEX_DIG_PLAN_DECODER`.
- **Hex encoding**: Each 6-digit hex token `DDDDDM` decodes `DDDDD` (`0x00001..0xfffff`) as a positive `bigint` distance and `M` (`'0' | '1' | '2' | '3'` -> `'R' | 'D' | 'L' | 'U'`) as the dig direction while retaining `#dddddd` for trench visualization.
- **Web manifest**: `2023/day18/part2/index.ts` exports `manifest` for auto-discovery by `site/registry.ts`.
- **Visualizer**: `LagoonPart2Visualizer` renders telemetry badges (steps, huge BigInt bounds, running `B` and `2A`, final `I` and volume), an aspect-preserving SVG projection with RGB trench segments and Shoelace fan, legend, and `PlaybackControls`.

## Maintainer Notes

- `domain/hexDecoder.ts`: Validates the 6-digit hex token (`/^[0-9a-f]{6}$/i`), rejects direction codes outside `'0'..'3'` with `SyntaxError`, rejects `0n` distance with `RangeError`, and returns frozen instructions.
- `domain/solver.ts`: Wires `createLagoonSolver(HEX_DIG_PLAN_DECODER)` with zero duplication of polygon geometry or trace sampling from `2023/day18/shared/`.
- `viz/LagoonPart2Visualizer.tsx`: Thin Part 2 wrapper around `LagoonPolygonVisualizer`, bounding animated frames to `DEFAULT_MAX_TRACE_STEPS` (`120`).
- `domain/hexDecoder.test.ts` & `domain/solver.test.ts`: Verify hex decoding boundaries, the official example (`952408144115n`), `> Number.MAX_SAFE_INTEGER` precision, SVG projection bounds, and differential checks against an independent BigInt horizontal scanline oracle.
