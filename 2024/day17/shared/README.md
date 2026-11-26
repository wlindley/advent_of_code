# 2024 Day 17 Shared — Chronospatial Computer

## Consumer Guide

- **`index.ts`**: Pure TypeScript barrel exporting `VmRegisters`, `ChronospatialProgram`, `parseChronospatialInput`, `OPCODE_TABLE`, `disassembleProgram`, `runProgram`, `traceProgram`, and `formatOutput`. Zero React/DOM imports.
- **`viz/`**: Exports `RegisterPanel`, `DisassemblyTape`, and `ChronospatialDebugger` (reusable across Part 1 and Part 2 via optional `targetOutput` and `extraPanel`).

## Maintainer Guide

- **BigInt VM (`vm.ts`, `opcodes.ts`)**: Arbitrary-precision non-negative `VmRegisters` backed by exhaustive `OPCODE_TABLE` and `COMBO_RESOLVERS` records (`divPow2` guards against shift overflow when `shift >= bitLength(A)`).
- **Trace sampling**: `traceProgram` runs a 2-pass bounded capture (`DEFAULT_MAX_TRACE_STEPS = 240`) with frozen per-frame `output` snapshots.
- **Verification**: `vm.oracle.test.ts` cross-checks `runProgram` against an independent textbook `switch`-based interpreter across all 5 short examples, the main example, 64-bit registers, odd-IP `jnz` jumps, and 100 seeded synthetic programs.
