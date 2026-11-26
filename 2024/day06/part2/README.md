# `2024/day06/part2` — Guard Gallivant (Part 2)

## Consumer Guide
Pure TypeScript solver and interactive Canvas 2D loop-obstruction visualizer for Advent of Code 2024 Day 6 Part 2.

- **CLI Execution**: `npm run aoc -- run 2024 6 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/jumpTable.ts`: `ObstacleJumpTable` precomputes 4 directional stop tables (`Int32Array`) and performs `O(1)` ray-interception with local generation-stamped `Uint32Array` turn-state cycle detection and `traceLoopPath` trajectory extraction.
- `domain/solver.ts`: `LoopCandidateFrame` stores immutable obstruction + approach/cycle vertices with dynamically computed `cycleTurns`/`cycleSteps`; `traceLoopObstructions` bounds traces at `DEFAULT_MAX_TRACE_STEPS` (`200`) via `sampleTraceIndices`.
- `viz/`: HiDPI Canvas 2D floorplan highlighting all loop obstruction pins, active obstacle, dashed blue approach path, solid crimson closed cycle, amber turn dots, and gold start ring with `PlaybackControls`.
