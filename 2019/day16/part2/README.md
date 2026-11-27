# 2019 Day 16 Part 2 — Flawed Frequency Transmission

## Consumer Guide

- **Entry point**: `manifest` in `index.ts` and `solver` in `domain/solver.ts`.
- **CLI execution**: `npm run aoc -- run 2019 16 2` (or pass `--input <path>`).
- **Behavior**: Reads the 7-digit offset from the signal prefix, simulates 100 suffix-sum FFT phases over `[offset, 10000 * N)`, and returns the 8-digit message at `offset`.
- **Visualizer**: `viz/Visualizer.tsx` animates up to `40` sampled tail phases with a suffix spectrum strip, 0–9 digit histogram, and upper-triangular suffix summation matrix.

## Maintainer Guide

- `domain/solver.ts` binds `FftSolver` to `OFFSET_MESSAGE_POLICY` from `../../shared`.
- `domain/index.ts` re-exports `solver` for manifest and CLI consumers without React/DOM dependencies.
- `viz/Visualizer.tsx` delegates rendering to `FftVisualizer` from `../../shared/viz/FftVisualizer`.
