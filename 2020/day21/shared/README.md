# 2020 Day 21 Shared Domain

## User Guide
Pure TypeScript domain package for AoC 2020 Day 21 (*Allergen Assessment*).
Instantiate `new AllergenAssessmentSolver(SAFE_APPEARANCES_POLICY)` for Part 1 or
`new AllergenAssessmentSolver(DANGEROUS_LIST_POLICY)` for Part 2 via `./index.ts`.

## Developer Architecture
- `model.ts`: Strict food/allergen parser and immutable `Food`/`AllergenDocument` with derived `BigInt` masks and frequencies.
- `analysis.ts`: Per-allergen candidate mask intersection (`analyzeAllergens`) and one-sided singleton peeling (`resolveAllergenMapping`).
- `traceFrames.ts`, `policies.ts`, `solver.ts`: Polymorphic `AllergenPolicy` and bounded trace frames (`IntersectionTraceFrame` | `PeelingTraceFrame`).
- `projection.ts`: Pure-TS SVG view-model projections for partitioned intersection bars and peeling compatibility matrices.
