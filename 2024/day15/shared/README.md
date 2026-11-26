# 2024 Day 15 Shared Domain & Visualization

Shared pure-TypeScript warehouse parser, grid state model, rule-parameterized simulation/trace engine, and HiDPI Canvas 2D renderer for Advent of Code 2024 Day 15 (Part 1 and Part 2 ready).

## Consumer Guide

Import pure domain symbols from `./index` (zero React/DOM dependencies):

- `parseWarehouseSpec(raw)` & `MOVE_DELTAS` — parses CRLF-normalized two-section inputs into frozen `WarehouseSpec` (`rows`, `moves`).
- `WarehouseState` & `WarehouseSnapshot` — `Uint8Array`-backed grid supporting `O`, `[]`, `#`, `.`, and `@` tiles, bounds-safe `cellAt`, `setTile`, `moveRobotTo`, and dynamic `gpsSum` / `boxCount` / `toAsciiRows()`.
- `runWarehouseSimulation`, `buildWarehouseTrace`, `createWarehouseSolver` — executes any `WarehouseRule` and records endpoint-preserving sampled `WarehouseFrame` traces (`DEFAULT_MAX_TRACE_STEPS = 240`).

Visual components in `./viz/` (`.tsx` only): `WarehouseCanvas.tsx` and `WarehouseVisualizer.tsx`.

## Maintainer Guide

- **Module DAG**: `parse.ts` / `warehouseState.ts` -> `simulation.ts` -> `index.ts`. `shared/viz/*` imports only from `../index` and `shared/viz`.
- **Invariants**: `WarehouseSnapshot` copies the underlying `Uint8Array` into a private `#cells` buffer and freezes `this` without calling `Object.freeze()` on the `Uint8Array` itself (which throws `TypeError` in V8). `WarehouseState.fromRows` enforces rectangular dimensions, single robot `@`, and paired `[]` brackets.
