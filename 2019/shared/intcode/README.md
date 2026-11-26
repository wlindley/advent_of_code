# `2019/shared/intcode` — Reusable Year-Scoped Intcode Virtual Machine

## Consumer Guide
Pure TypeScript Intcode VM primitives shared across AoC 2019 Intcode puzzles.

- `parseIntcodeProgram(raw)` & `IntcodeProgram`: immutable BigInt memory image with `withPatches`.
- `IntcodeMemory`: encapsulated mutable `MemoryAccess` with BigInt-first bounds checking.
- `SparseIntcodeMemory`: hybrid dense-base + sparse-Map `SparseMemoryAccess` with BigInt high-address reads/writes and zero-elision.
- `modes.ts`: `POSITION_MODE` (`0`), `IMMEDIATE_MODE` (`1`), `RELATIVE_MODE` (`2`), `CORE_MODES`, `COMPLETE_MODES`, `createModeRegistry`, `decodeOpcode`, `extractModeCode`.
- `io.ts`: `IoChannel` contract & cursor-indexed FIFO `BufferedIoChannel`.
- `opcodes.ts`: `CORE_OPCODES` (`1, 2, 99`), `IO_OPCODES` (`3, 4`), `CONTROL_OPCODES` (`5..8`), `RELATIVE_BASE_OPCODES` (`9`), `STANDARD_OPCODES`, `COMPLETE_OPCODES`, and `createOpcodeRegistry`.
- `IntcodeMachine`: steppable VM (`step()`, `run(maxSteps)`, `pushInput()`, `relativeBase`, `fromCompleteProgram()`) supporting `'running' | 'waiting-input' | 'halted'` states and `DetailedIntcodeStep` telemetry.

## Maintainer Guide
- `program.ts` / `memory.ts` / `sparseMemory.ts`: enforce BigInt non-negative bounds before `Number()` indexing on the base tape, and isolate sparse writes in a `Map<bigint, bigint>`.
- `modes.ts`: pure parameter-mode strategies (`MemoryAccess`-only dependency, zero cycle with `opcodes.ts`); `RELATIVE_MODE.resolveWriteAddress` rejects negative effective addresses before I/O reads.
- `opcodes.ts`: strategy contract (`ExecutionContext`) with writability check before I/O reads, lazy jump target evaluation, and `adjustRelativeBase(delta)`.
- `machine.ts`: `StepRecorderContext` captures decoded reads, writes, and I/O events per step and commits `relativeBase` atomically on non-waiting steps while preserving `DetailedIntcodeStep` backward compatibility.
