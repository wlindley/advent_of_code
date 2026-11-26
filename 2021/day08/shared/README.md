# 2021 Day 8 Shared Domain & Visualization

## Consumer Guide

- **`2021/day08/shared`**: Pure TypeScript barrel exporting `SignalPattern`, `DisplayEntry`, `WireMapping`, `DecodedDigit`, `DecodedDisplay`, `deduceWireMapping`, `decodeDisplayEntry`, `parseDisplayEntry`, `parseDisplayNotes`, `DisplayEvaluationPolicy` (`UNIQUE_DIGITS_POLICY`, `DECODED_OUTPUT_SUM_POLICY`), and `SevenSegmentSolver`.
- **`2021/day08/shared/viz/SevenSegmentVisualizer.tsx`**: Reusable interactive visualizer rendered by Part 1 (and Part 2) displaying entry playback, 4-digit beveled 7-segment LED readouts, and the per-wire frequency deduction table.

## Maintainer Guide

- **One-way DAG**: `shared/core` -> `segments` -> `entry` -> `wiring` -> `policy` / `parser` -> `solver` -> `shared/index.ts` -> `part1/domain/` -> `shared/viz/` -> `part1/viz/`.
- **Bitmask representation**: 7-bit integers in `[1, 127]` (`bit 0 = 'a'` .. `bit 6 = 'g'`) represent signal sets cleanly; `WireMapping` stores a defensive `Uint8Array(7)` bijection (freezing `this`, never the typed array).
- **Closed-form wire deduction**: `deduceWireMapping` classifies all 7 wires using their signal frequency (`4, 6, 9, 8, 7`) plus membership in the unique 2-segment (`1`) and 4-segment (`4`) patterns, then round-trip verifies every one of the 10 signals decodes to a canonical digit.
- **UI isolation**: `shared/index.ts` contains zero `viz/` imports; all `viz/` modules use `.tsx` extensions exclusively.
