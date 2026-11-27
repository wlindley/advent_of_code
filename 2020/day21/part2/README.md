# 2020 Day 21 Part 2 — Allergen Assessment

## User Overview
Determines which specific ingredient contains each listed allergen through iterative singleton elimination, then outputs the canonical dangerous ingredient list ordered alphabetically by allergen name.

## Developer Notes
- **Domain Entry (`domain/solver.ts`)**: Binds `AllergenAssessmentSolver` to `DANGEROUS_LIST_POLICY` and re-exports `solver` via `domain/index.ts`.
- **Visualizer (`viz/AllergenPart2Visualizer.tsx`)**: Thin wrapper passing `solver` to `AllergenVisualizer` to render peeling-round trace frames.
- **Manifest (`index.ts`)**: Exports `manifest` (`PuzzlePartManifest`) with the 4-food example (`exampleAnswer: 'mxmxvkd,sqjhc,fvjkl'`).
