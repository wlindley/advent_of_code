# `2024/day05/part1` — Print Queue (Part 1)

## Consumer Guide
Pure solver and SVG precedence arc visualizer for Advent of Code 2024 Day 5 Part 1.

- **CLI Execution**: `npm run aoc -- run 2024 5 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: validates each `PrintUpdate` via `PageOrderRules.isValidOrder`, accumulates valid middle pages, and emits uniformly sampled `PrintQueueTraceFrame` snapshots capped at `DEFAULT_MAX_TRACE_STEPS` (`200`).
- `PrintQueueTraceFrame`: stores minimal state and computes `isValid`, `violationCount`, and `middleContribution` dynamically from `applicableRules`.
- `viz/PrintQueueVisualizer.tsx`: renders an SVG precedence arc diagram (`baselineY = 120`) with satisfied green arcs above, violated crimson right-to-left arrows below, gold middle-page highlight, and `PlaybackControls`.
