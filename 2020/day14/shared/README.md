# 2020 Day 14 — Docking Data Shared Domain

## User / Consumer Guide

Pure TypeScript domain package modeling AoC 2020 Day 14 36-bit docking programs under both value-masking (Part 1, `DECODER_V1_POLICY`) and floating-address (Part 2, `DECODER_V2_POLICY`) decoder policies:

- **`model.ts`**: `Bitmask` (immutable 36-char `[01X]` pattern with dynamic `setMask`, `floatingMask`, counts, `applyToValue`, `baseAddressFor`, bounded `expandedAddresses`), `DockingProgram`, `assertUint36`, and `parseDockingProgram`.
- **`policies.ts`**: `DecoderChipPolicy`, `DECODER_V1_POLICY`, `DECODER_V2_POLICY`, and immutable `DockingTraceFrame` snapshots.
- **`solver.ts`**: `MemoryBank`, `TraceMemoryBank` (O(1) bounded MRU snapshot), and `DockingSolver` implementing `PuzzleSolver<DockingProgram, bigint, DockingTraceFrame>` with `DEFAULT_MAX_TRACE_STEPS = 200`.
- **`projection.ts`**: Pure UI projection helpers (`formatUint36Binary`, `formatInstructionLabel`, `projectBitGateColumns`, `projectStepSummary`).
- **`index.ts`**: Pure TypeScript barrel (zero `viz/` or DOM imports).

## Developer / Maintainer Guide

- **36-bit BigInt Safety**: All arithmetic uses `bigint` masked against `WORD_MASK = (1n << 36n) - 1n` to avoid JS 32-bit bitwise truncation, and `iterateExpandedAddresses` checks `sub === 0n` before subtracting `1n`.
- **Single Source of Truth**: Derived counts, masks, sums, and step projections are computed dynamically via getters or pure projection functions.
- **Oracles**: `oracle.test.ts` cross-checks both policies against independent 36-character binary-string reference oracles across official examples and 40 seeded PRNG programs.
