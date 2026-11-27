# 2020 Day 21 Part 1 — Allergen Assessment

## User Overview
Identifies ingredients that cannot possibly contain any listed allergen by intersecting ingredient sets per allergen across all foods, then sums how many times those guaranteed-safe ingredients appear.

## Developer Notes
- **Domain Entry (`domain/solver.ts`)**: Binds `AllergenAssessmentSolver` to `SAFE_APPEARANCES_POLICY` and re-exports `solver` via `domain/index.ts`.
- **Visualizer (`viz/AllergenPart1Visualizer.tsx`)**: Thin wrapper passing `solver` to `AllergenVisualizer`.
- **Manifest (`index.ts`)**: Exports `manifest` (`PuzzlePartManifest`) with the 4-food example (`exampleAnswer: '5'`).
