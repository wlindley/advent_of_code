# 2022 Day 23 Shared Domain — Unstable Diffusion

## Consumer Guide

- `index.ts` exports pure TypeScript domain primitives for Parts 1 and 2 (zero React/DOM or `viz/` imports):
  - `parseElves(raw)` parses `.`/`#` grids into frozen `ElfCoord[]`.
  - `simulateRounds(elves, rounds)` executes up to `rounds` rounds (exiting early on static equilibrium) and returns `SimulationResult`.
  - `findFirstStaticRound(elves, maxRounds)` returns the 1-indexed round where zero elves move.
  - `traceFixedRounds(elves, rounds, options)` and `traceUntilStatic(elves, maxRounds, options)` produce bounded `DiffusionFrame[]` snapshots for visualization.

## Maintainer Guide

- Module DAG (acyclic): `types` -> `parser` & `directionLut` -> `gridBuffer` -> `simulator` -> `index`.
- **Static-Equivalence Theorem**: If `movedCount === 0` in round `r`, every elf with a neighbor would have at least one extremal elf in the round's first priority direction unblocked and collision-free; hence zero moves implies every elf is isolated and all subsequent rounds are static.
- **Perpendicular-Wedge 2-Collider Invariant**: Two perpendicular proposals cannot share a target cell because each wedge checks the three adjacent cells in that direction; thus at most two opposing elves can collide at any cell, allowing exact 2-branch `propTag` collision tracking (`tag = round * 2`).
- **Margin Growth Invariant**: `DiffusionGrid` stores world-space `Int32Array` coordinates and inspects `this.bounds` directly in `ensureMargin()` before each step, avoiding cached derived bounds.
