# `2024/day03/part2` — Mull It Over: Conditional Execution

## Consumer Guide
Pure solver and interactive conditional-gate visualization for Advent of Code 2024 Day 3 Part 2.

- **CLI Execution**: `npm run aoc -- run 2024 3 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: folds an immutable `ExecutionState` (`enabled` initialized to `true`) over `ParsedMemory.instructions`, updating the gate on `do()`/`don't()` and summing `mul(X,Y).product` only when enabled. Exports `computeInstructionStates` (1:1 boolean gate array) and bounded `traceConditionalMultiplications` (max `200` sampled frames via `sampleTraceIndices`).
- `viz/ConditionalTapeSvg.tsx` & `viz/ConditionalMulVisualizer.tsx`: consume `computeInstructionStates` and `solver.trace` with `usePlayback` and `<PlaybackControls>` to render a 36-char sliding tape window, `ENABLED`/`DISABLED` gate badge, 5-row instruction window, and 72-slot gate overview ribbon.
