# 2023 Day 22 Shared Domain

## Consumer Guide

Pure TypeScript domain modules for AoC 2023 Day 22 (*Sand Slabs*):

- `parseBrickSnapshot(raw)` / `BrickSnapshot` / `Brick`: parses `x1,y1,z1~x2,y2,z2` lines (stripping only trailing line endings), normalizes reversed endpoints, validates `zMin >= 1` and axis alignment, and computes `height`, `cellCount`, `axis`, and `bounds` dynamically.
- `settleBricks(snapshot)` / `SettledStack` / `SettledBrick`: drops bricks vertically onto `z >= 1` using an `Int32Array` XY height map (guarded by `MAX_FOOTPRINT_AREA = 1_000_000`), detects overlapping inputs (`maxH >= brick.zMin`), and records deduplicated ascending `supportedBy` lists keyed by settled index `0..N-1`.
- `SupportGraph(stack)`: builds `supports` adjacency, `baseInDegree`, and `loadBearing` flags in `O(N + E)` and exposes `safeCount`, `loadBearingCount`, `isSafe(i)`, `supportersOf(i)`, `dependentsOf(i)`, `cascadeFrom(i)`, and `totalChainReactionFalls()`.
- `buildSlabTrace(stack, graph, options)` / `formatBrickLabel(id)`: produces bounded scalar-only settling frames (`SlabTraceFrame`) capped at `DEFAULT_MAX_TRACE_STEPS = 128`.

## Maintainer Architecture

- **Module DAG**: `brickSnapshot.ts` -> `settleStack.ts` -> `supportAnalysis.ts` -> `slabTrace.ts`; `index.ts` is a pure TS barrel with zero `viz/` imports.
- **Invariants**: All domain entities freeze `this` and list fields; TypedArrays (`Int32Array`, `Uint8Array`) are never passed to `Object.freeze()`. Derived geometry and aggregate counts are computed via getters with zero stored derived state.
