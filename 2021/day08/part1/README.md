# 2021 Day 8 Part 1 — Seven Segment Search

## Consumer Guide

- **Domain entrypoint**: `solver` in `2021/day08/part1/domain` (`SevenSegmentSolver` bound to `UNIQUE_DIGITS_POLICY`).
- **Manifest**: `manifest` in `2021/day08/part1` exposing `meta`, `exampleInput`, `exampleAnswer` (`'26'`), `solver`, and `Visualizer`.
- **Examples**: Small 1-entry sample evaluates to `0`; 10-entry example evaluates to `26`.

## Maintainer Guide

- `part1/domain/solver.ts` instantiates `new SevenSegmentSolver(UNIQUE_DIGITS_POLICY)` with zero duplicated decoding logic.
- `part1/viz/Part1Visualizer.tsx` delegates rendering and playback directly to `SevenSegmentVisualizer` with the Part 1 solver.
- Pure domain modules maintain 100% V8 test coverage and zero UI imports.
