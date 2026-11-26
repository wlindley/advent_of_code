# 2024 Day 14 Shared Domain & Visualization

Shared pure-TypeScript toroidal robot swarm model, parser, simulation primitives, occupancy snapshots, and HiDPI Canvas 2D renderer for Advent of Code 2024 Day 14 (Part 1 and Part 2 ready).

## Consumer Guide

Import pure domain symbols from `./index` (zero React/DOM dependencies):

- `TorusSpace` (`DEFAULT_REDOUBT_SPACE` = `101×103`, `EXAMPLE_REDOUBT_SPACE` = `11×7`) & `Robot` — frozen value objects with O(1) modular `positionAt(space, seconds)` and midline-aware `quadrantOf(x, y)`.
- `parseRobots(raw)` — parses `p=x,y v=vx,vy` lines (ignoring blank lines, normalizing CRLF, rejecting empty/invalid specs).
- `countQuadrants`, `safetyFactorOf`, `evaluateSafetyFactor`, `fillOccupancy`, `countOccupancyQuadrants`, `countAdjacentOccupied` — quadrant counting, reusable `Uint32Array` occupancy accumulation, and orthogonal neighbor-pair density scoring.
- `RedoubtSnapshot` & `buildRedoubtSnapshot` — defensively copied occupancy snapshots whose `totalRobots`, `maxDensity`, `uniqueCells`, `quadrants`, `safetyFactor`, and `adjacentPairs` are computed dynamically without stored derived state.

Visual component in `./viz/`: `RedoubtCanvas.tsx` (`.tsx`-only HiDPI Canvas 2D density & quadrant-crosshair renderer).

## Maintainer Guide

- **Module DAG**: `model.ts` -> `parser.ts` / `simulation.ts` -> `snapshot.ts` -> `index.ts`. `shared/viz/RedoubtCanvas.tsx` imports only from `../index`.
- **Invariants**: `TorusSpace` requires odd positive safe-integer dimensions with safe-integer `area`. `RedoubtSnapshot` copies the caller's `Uint32Array` into a private `#occupancy` buffer and freezes `this` (never freezing the TypedArray itself, which throws `TypeError` in V8).
- **O(1) Time Stepping**: `stepCoordinate` wraps initial position, velocity, and `seconds % size` via `euclideanMod` so multi-period evaluations remain exact without stepping second-by-second.
