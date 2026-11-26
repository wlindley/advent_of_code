# 2024 Day 17 Part 2 — Chronospatial Computer

## Consumer Guide

- **Manifest**: `./index.ts` exports `manifest: PuzzlePartManifest` for site auto-discovery using the official self-reproducing example (`117440`).
- **Domain Solver**: `./domain/solver.ts` exports `solver` (`PuzzleSolver<ChronospatialProgram, bigint, VmTraceFrame>`), solving for the lowest positive Register A via `searchLowestQuine` and generating a bounded VM verification trace with `traceProgram`.
- **Search API**: `./domain/quineSearch.ts` exports `searchLowestQuine(program, options?)`, `QuineReconstructionStep`, `QuineSearchResult`, and `DEFAULT_MAX_SEARCH_CANDIDATES`.
- **Visualizer**: `./viz/ChronospatialPart2Visualizer.tsx` renders `ChronospatialDebugger` (`Part 2 (Quine Verification)`) with target token comparison and a `QuineOctalPanel` displaying the reconstructed octal digits, candidate count, and backtracks.

## Maintainer Guide

- **Algorithm & Invariants**: `searchLowestQuine` reconstructs Register A backward from `instructions.length - 1` down to `0` using `dfsOctalPrefix`. At each depth, `collectMatchingDigits` tests 3-bit extensions `(prefix << 3n) | d` in ascending order (`1..7` for the leading digit so Register A stays positive, `0..7` thereafter) and compares the VM output against `instructions.slice(pos)`.
- **Domain Purity**: `QuineReconstructionStep` and `QuineSearchResult` freeze their arrays and instances, validate constructor invariants with `RangeError`, and compute `candidate` and `registerA` via dynamic getters with zero stored derived state.
- **Verification**: `quineSearch.test.ts` checks invariants, the official example (`117440n`, `14` backtracks), a 16-token synthetic quine, initial `B`/`C` preservation, and error bounds; `quineSearch.oracle.test.ts` proves minimality by brute force on `0,3,5,4,3,0` and cross-checks against a non-recursive backward-octal-BFS all-quines oracle; `solver.test.ts` exercises `executeSolver` and bounded/default traces.
