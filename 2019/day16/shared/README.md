# 2019 Day 16 Shared FFT Domain & Visualization Kit

## Consumer Guide

- **`index.ts`**: Pure TypeScript public API (zero React/DOM imports) exporting `Signal`, `runFullFft`, `runTailFft`, `solveOffsetMessage`, `FftSolver`, `FULL_SIGNAL_POLICY`, `OFFSET_MESSAGE_POLICY`, trace generators, and SVG layout builders.
- **`viz/FftVisualizer.tsx`**: Interactive light-mode FFT playback visualizer parameterized by `FftSolver` for both Part 1 and Part 2.

## Maintainer Guide

- **`signal.ts`**: Immutable `Signal` value object backed by a private `Uint8Array`, plus shared integer validators and 0-based `patternWeight`.
- **`fullFft.ts`**: `O(N log N)` per-phase harmonic prefix-sum FFT (`stepFftPhase`, `runFullFft`).
- **`tailFft.ts`**: `O(tailLength)` per-phase in-place suffix-sum FFT (`stepTailPhaseInPlace`, `runTailFft`, `solveOffsetMessage`) valid for `offset >= floor(totalLength / 2)`.
- **`trace.ts`**: Uniformly sampled `FftTraceFrame` snapshots (`DEFAULT_MAX_TRACE_STEPS = 40`) without stored derived values.
- **`policies.ts` & `solver.ts`**: Strategy policies decoupling Part 1 and Part 2 behind `FftSolver`.
- **`vizLayout.ts`**: Pure geometry builders for the digit spectrum strip, 0–9 histogram, and batched 3-path SVG pattern heatmap.
