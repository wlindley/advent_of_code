# `2019/shared/intcode` — Reusable Year-Scoped Intcode Virtual Machine

## Consumer Guide
Pure TypeScript Intcode VM primitives shared across AoC 2019 Intcode puzzles.

- `parseIntcodeProgram(raw)` & `IntcodeProgram`: immutable BigInt memory image with `withPatches`.
- `IntcodeMemory`: encapsulated mutable `MemoryAccess` with BigInt-first bounds checking.
- `CORE_OPCODES` & `createOpcodeRegistry`: extensible `OpcodeHandler` registry (`ADD`, `MUL`, `HALT`).
- `IntcodeMachine`: steppable VM (`step()`, `run(maxSteps)`) emitting `IntcodeStep` telemetry.

## Maintainer Guide
- `program.ts` / `memory.ts`: enforce BigInt bounds (`0n <= addr < BigInt(len)`) before `Number()` indexing.
- `opcodes.ts`: strategy contract (`ExecutionContext`) decoupling instruction semantics from memory storage.
- `machine.ts`: `StepRecorderContext` captures exact reads and `previousValue -> value` writes without full-tape snapshots per step.
