# `2019/day07/part2` — Amplification Circuit (Part 2)

## Consumer Guide
Pure TypeScript solver and interactive schematic visualizer for Advent of Code 2019 Day 7 Part 2 (Feedback Loop Mode).

- **CLI Execution**: `npm run aoc -- run 2019 7 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: binds `FEEDBACK_LOOP_MODE` (`[5n, 6n, 7n, 8n, 9n]`) to `AmplifierCircuitSolver` from `../../shared`.
- `viz/Visualizer.tsx`: delegates rendering to `<AmplifierVisualizer>` with `<AmplifierChainSvg>`, `<LeaderboardPanel>`, and `<PlaybackControls>`.
