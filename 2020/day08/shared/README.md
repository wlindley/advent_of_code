# 2020 Day 8 Shared Domain (`Handheld Halting`)

## Consumer Guide

Import pure domain types, execution policies, viewport projections, and solvers from `2020/day08/shared`:

- `parseBootProgram(raw)` -> validated immutable `BootProgram` of frozen `BootInstruction` value objects.
- `executeBootProgram(program)` -> `ExecutionRun` with `HaltStatus` (`'loop-detected' | 'terminated' | 'out-of-bounds'`) and `bigint` accumulator precision.
- `LOOP_ACCUMULATOR_POLICY` / `REPAIR_BOOT_POLICY` -> `BootDiagnosisPolicy` strategies for Part 1 loop detection and Part 2 `O(N)` reverse-BFS single-instruction repair.
- `traceBootDiagnosis(program, policy, options?)` -> budget-bounded `BootTraceFrame[]` snapshots preserving exact visit-order maps across downsampling.
- `computeDebuggerWindow(frame, maxVisibleRows)` -> centered `DebuggerWindow` with `JumpArcProjection` for clipped/forward/backward jump arcs.
- `new BootCodeSolver(policy)` -> `PuzzleSolver` implementation exposing `parse`, `solve`, `trace`, and `policy`.

Interactive React visualizers live separately under `2020/day08/shared/viz/` and are never re-exported by `shared/index.ts`.

## Maintainer Architecture

Strict one-way DAG:

`shared/core -> operation.ts -> instruction.ts -> program.ts -> execution.ts -> policy.ts -> trace.ts -> (viewport.ts, solver.ts) -> index.ts`

- Every domain value object is deeply frozen (`Object.freeze(this)`) with zero stored derived state.
- `resolveOperation` uses a `Map` to eliminate prototype-key collisions (`constructor`, `toString`, `__proto__`).
- `REPAIR_BOOT_POLICY` builds flat `Int32Array` reverse-adjacency lists (`revHead`, `revNext`) and `Uint8Array` reachability from exit node `n`, then scans the initial trace in `O(N)` for the unique toggleable instruction targeting a terminating node.
