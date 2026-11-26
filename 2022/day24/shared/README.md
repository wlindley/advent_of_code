# 2022 Day 24 Shared Domain — Blizzard Basin

## Consumer Guide

- `index.ts` exports pure TypeScript domain primitives for Parts 1 and 2 (zero React/DOM or `viz/` imports):
  - `parseBasin(raw)` parses `#`/`.`/`^`/`v`/`<`/`>` maps into an immutable `BlizzardBasin`.
  - `solveLeg(basin, from, to, startTime)` finds a shortest crossing between `'start'` and `'end'` starting at `startTime`.
  - `solveTrip(basin, waypoints)` chains sequential legs (such as `PART1_WAYPOINTS` or `PART2_WAYPOINTS`) into a `TripResult`.
  - `traceTrip(basin, waypoints, options)` produces a bounded sequence of `BasinFrame` snapshots for visualization.

## Maintainer Guide

- Module DAG (acyclic): `basin` -> `parser` & `types` -> `legBfs` -> `trip` -> `index`.
- **O(1) Periodic Blizzard Occupancy**: Blizzards wrap independently along each row (`innerWidth`) and column (`innerHeight`), so `blizzardMaskAtMod(ir, ic, tr, tc)` computes any cell's 4-bit blizzard mask in constant time using branchless modular offsets without allocating per-minute grid copies.
- **Time-Layered `(phase, cell)` BFS**: `solveLeg` searches `(time % period, cellId)` layers where `period = lcm(innerHeight, innerWidth)`. Each layer evaluates all 5 actions (`wait`, `up`, `down`, `left`, `right`) and checks target arrival once per layer, reconstructing exact `Int32Array` cell paths via `undoAction`.
