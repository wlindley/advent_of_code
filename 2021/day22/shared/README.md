# 2021 Day 22 Shared Reactor Core

## Consumer Interface
- `createReactorSolver(policy)` builds a `PuzzleSolver` for bounded initialization (`INITIALIZATION_POLICY`) or full-grid reboot (`FULL_REACTOR_POLICY`).
- `Cuboid`, `parseRebootSteps`, `executeReboot`, `totalOnVolume`, `traceReboot`, and 3D isometric `projection` helpers provide exact `bigint` geometry and bounded visualization frames.

## Developer Invariants
- `Cuboid` and `ReactorTraceFrame` are `Object.freeze`-immutable; derived frame counts (`onCount`, `cuboidCount`, `skipped`) are computed getters with zero stored derived state.
- `applyEffectiveStep` maintains pairwise-disjoint active cuboids via 6-way axis-aligned slab subtraction (`Cuboid.subtract`), avoiding coordinate-compression grid allocation.
- `shared/index.ts` is strictly pure TypeScript with zero `viz/` imports.
