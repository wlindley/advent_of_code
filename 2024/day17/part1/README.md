# 2024 Day 17 Part 1 — Chronospatial Computer

## Consumer Guide

- **Manifest**: `./index.ts` exports `manifest: PuzzlePartManifest` for site registry auto-discovery with the official 3-bit example (`4,6,3,5,6,3,5,2,1,0`).
- **CLI / Domain Solver**: `./domain/solver.ts` exports `solver` (`PuzzleSolver<ChronospatialProgram, string, VmTraceFrame>`) backed by `parseChronospatialInput`, `runProgram`, `formatOutput`, and `traceProgram` from `../../shared`.
- **Visualizer**: `./viz/ChronospatialPart1Visualizer.tsx` renders `ChronospatialDebugger` (`Part 1 (VM Execution)`) showing live BigInt registers (decimal, octal with low 3-bit digit highlighted, and 3-bit grouped binary), raw instruction tape, disassembly table, output strip, and playback controls.

## Maintainer Guide

- **Architecture**: `part1/domain/` is a thin adapter over `../../shared`, keeping all VM parsing, opcode semantics, execution, and trace generation shared for Part 2 reuse.
- **Verification**: `part1/domain/solver.test.ts` checks `executeSolver` with a deterministic clock fake, bounded traces, and error conditions; `shared/vm.oracle.test.ts` cross-checks `runProgram` against an independent textbook `switch`-based interpreter across official examples, 64-bit registers, odd-IP jumps, and 100 seeded synthetic programs.
