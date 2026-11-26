# `2019/shared/intcode` — Reusable Year-Scoped Intcode Virtual Machine

## Consumer Guide
Pure TypeScript Intcode VM primitives shared across AoC 2019 Intcode puzzles.

- `parseIntcodeProgram(raw)` & `IntcodeProgram`: immutable BigInt memory image with `withPatches`.
- `IntcodeMemory`: encapsulated mutable `MemoryAccess` with BigInt-first bounds checking.
- `modes.ts`: `POSITION_MODE` (`0`), `IMMEDIATE_MODE` (`1`), `CORE_MODES`, `createModeRegistry`, `decodeOpcode`, `extractModeCode`.
- `io.ts`: `IoChannel` contract & cursor-indexed FIFO `BufferedIoChannel`.
- `opcodes.ts`: `CORE_OPCODES` (`1, 2, 99`), `IO_OPCODES` (`3, 4`), `CONTROL_OPCODES` (`5..8`), `STANDARD_OPCODES`, and `createOpcodeRegistry`.
- `IntcodeMachine`: steppable VM (`step()`, `run(maxSteps)`, `pushInput()`) supporting `'running' | 'waiting-input' | 'halted'` states and `DetailedIntcodeStep` telemetry.

## Maintainer Guide
- `program.ts` / `memory.ts`: enforce BigInt bounds (`0n <= addr < BigInt(len)`) before `Number()` indexing.
- `modes.ts`: pure parameter-mode strategies (`MemoryAccess`-only dependency, zero cycle with `opcodes.ts`).
- `opcodes.ts`: strategy contract (`ExecutionContext`) with writability check before I/O reads and lazy jump target evaluation.
- `machine.ts`: `StepRecorderContext` captures decoded reads, writes, and I/O events per step while preserving `IntcodeStep` backward compatibility.
