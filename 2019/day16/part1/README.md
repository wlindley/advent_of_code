# 2019 Day 16 Part 1 — Flawed Frequency Transmission

## Consumer Guide

- **Entry point**: `manifest` in `index.ts` and `solver` in `domain/solver.ts`.
- **CLI execution**: `npm run aoc -- run 2019 16 1` (or pass `--input <path>`).
- **Behavior**: Parses a decimal digit sequence, runs 100 phases of full-signal FFT, and outputs the first 8 digits.
- **Visualizer**: `viz/Visualizer.tsx` animates up to `40` sampled phases with a signal spectrum strip, 0–9 digit histogram, and interactive 16×16 harmonic pattern matrix.

## Maintainer Guide

- `domain/solver.ts` binds `FftSolver` to `FULL_SIGNAL_POLICY` from `../../shared`.
- `domain/index.ts` re-exports `solver` for manifest and CLI consumers without React/DOM dependencies.
- `viz/Visualizer.tsx` delegates rendering to `FftVisualizer` from `../../shared/viz/FftVisualizer`.
