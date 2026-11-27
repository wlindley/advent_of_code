# 2021 Day 19 Shared Domain — Beacon Scanner

Pure TypeScript 3D vector, proper-rotation, pairwise-distance fingerprint, BFS alignment, orthographic projection, policy, bounded tracer, and solver modules for 2021 Day 19.

## Consumer Interface (`shared/index.ts`)

- **Geometry (`vec3.ts`, `rotation.ts`)**: `Vec3` (safe-integer validated, `-0` normalized), `ROTATIONS_24` (24 right-handed `det = +1` orientations starting with `IDENTITY_ROTATION`).
- **Scanner & Parser (`scanner.ts`, `parser.ts`)**: `ScannerReport`, `AlignedScanner`, `computePairwiseSqDistances`, `countSharedDistances`, `parseScannerReports`.
- **Aligner & Policy (`aligner.ts`, `policy.ts`)**: `findAxisOffsets`, `alignScanners`, `TrenchMap`, `BEACON_COUNT_POLICY` (Part 1), `MAX_SCANNER_MANHATTAN_POLICY` (Part 2).
- **Projection, Tracing & Solver (`projection.ts`, `trace.ts`, `solver.ts`)**: `computeProjectionBounds`, `projectTrenchSnapshot`, `traceBeaconAlignment` (bounded via `sampleTraceIndices` & `validateMaxSteps`), `BeaconScannerSolver`.

## Maintainer Architecture

- **One-Way DAG**: `vec3` -> `rotation` -> `scanner` -> `parser` -> `aligner` -> `policy` -> `projection` -> `trace` -> `solver` -> `index.ts`.
- **Purity & Safety**: `shared/index.ts` has zero React/DOM/`viz/` imports. `Float64Array` distance fingerprints stay encapsulated inside `aligner.ts` and are never passed to `Object.freeze`.
- **3D Alignment Algorithm**: Uses `C(minOverlap, 2)` sorted distance multiset intersection as a rotation-invariant pre-filter, then collects all 1D axis offsets meeting `minOverlap` and verifies every `(tx, ty, tz)` candidate in 3D against the parent coordinate set.
