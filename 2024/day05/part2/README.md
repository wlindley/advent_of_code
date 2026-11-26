# `2024/day05/part2` — Print Queue (Part 2)

## Consumer Guide
Pure topological-repair solver and dual-track SVG visualizer for Advent of Code 2024 Day 5 Part 2.

- **CLI Execution**: `npm run aoc -- run 2024 5 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: filters invalid `PrintUpdate` sequences, constructs each update's induced subgraph via `PageOrderRules.inducedGraph`, computes a topological order via `DirectedGraph.topologicalOrder`, and sums repaired middle pages.
- `PrintRepairTraceFrame`: frozen snapshot storing only primary inputs (`repairIndex`, `totalInvalidUpdates`, `updateIndex`, `totalUpdates`, `original`, `repaired`, `originalRules`, `repairedRules`, `middleSumSoFar`); computes `repairedCountSoFar`, `repairedMiddlePage`, `violationCount`, `movedPageCount`, and `displacements` dynamically.
- `tracePrintRepairs`: validates `maxSteps` upfront (`DEFAULT_MAX_TRACE_STEPS = 200`), repairs every invalid update so `middleSumSoFar` remains exact, and emits uniformly sampled frames via `sampleTraceIndices`.
- `viz/PrintRepairSvg.tsx` & `viz/PrintRepairVisualizer.tsx`: render a dual-track Before (`y = 104`) / After (`y = 216`) SVG with upward violation arcs, cubic-Bezier page displacement ribbons, downward repaired green arcs, gold middle-page highlight, and `PlaybackControls`.
