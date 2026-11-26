# 2020 Day 5 Shared Domain (`Binary Boarding`)

## Consumer Guide

Import pure domain types, policies, and solvers from `2020/day05/shared`:

- `parseBoardingManifest(raw)` -> `BoardingManifest` of validated `BoardingPass` value objects.
- `CabinOccupancy.fromManifest(manifest)` -> 1024-seat bitset exposing `occupiedCount`, `minSeatId`, `maxSeatId`, `occupiedSeatIds`, and `missingInteriorSeatIds`.
- `HIGHEST_SEAT_POLICY` / `MISSING_INTERIOR_SEAT_POLICY` -> `SeatQueryPolicy` strategies returning `SeatQueryResult`.
- `traceSeatNarrowing(code)` -> 11 `BspStep` snapshots showing binary space partitioning across rows `0..127` and columns `0..7`.
- `new BoardingSolver(policy)` -> `PuzzleSolver` implementation with `parse`, `solve`, and `trace`.

Interactive React visualizers live separately under `2020/day05/shared/viz/` and are not re-exported by `shared/index.ts`.

## Maintainer Architecture

Strict one-way DAG:

`shared/core -> seat.ts -> occupancy.ts -> policy.ts -> bsp.ts (seat.ts only) -> trace.ts -> solver.ts -> index.ts`

- Every domain entity and value object is frozen via `Object.freeze(this)` with zero stored derived state.
- `CabinOccupancy` keeps its internal `Uint8Array(1024)` private and unfrozen so `typedArray[i]` writes work cleanly while preventing external mutation.
- `traceBoardingManifest` splits the `maxSteps` budget across a manifest scan phase and the 11-step BSP phase for the target seat.
