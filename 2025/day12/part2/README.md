# 2025 Day 12 Part 2 — Christmas Tree Farm (Finale Star)

## Consumer Guide
Claims the 24th and final star of Advent of Code 2025 (`[Finish Decorating the North Pole]`), unlocked automatically once all 23 preceding stars across Days 1–12 are solved.

- `verifyFinaleStar(collectedPriorStars)` validates eligibility (`>= 23`) and returns the submission value (`0`).
- `traceFinale(collectedPriorStars, options?)` emits bounded illumination frames for the 24-star tree visualizer.

## Maintainer Guide
- `domain/solver.ts`: Pure TypeScript eligibility verification and bounded star-tree frame generator (100% line & branch coverage).
- `viz/NorthPoleFinaleVisualizer.tsx`: Thin SVG tree renderer consuming `solver.trace` and `PlaybackControls`.
