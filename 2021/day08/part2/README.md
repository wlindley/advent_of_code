# 2021 Day 8 Part 2 — Seven Segment Search

## Consumer Guide

- **Domain entrypoint**: `solver` in `2021/day08/part2/domain` (`SevenSegmentSolver` bound to `DECODED_OUTPUT_SUM_POLICY`).
- **Manifest**: `manifest` in `2021/day08/part2` exposing `meta`, `exampleInput`, `exampleAnswer` (`'61229'`), `solver`, and `Visualizer`.
- **Examples**: Small 1-entry sample evaluates to `5353`; 10-entry example evaluates to `61229`.

## Maintainer Guide

- `part2/domain/solver.ts` instantiates `new SevenSegmentSolver(DECODED_OUTPUT_SUM_POLICY)` with zero duplicated decoding logic.
- `part2/viz/Part2Visualizer.tsx` delegates rendering and playback directly to `SevenSegmentVisualizer` with the Part 2 solver.
- Pure domain modules maintain 100% V8 test coverage and zero UI imports.
