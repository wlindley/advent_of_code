# 2020 Day 19 Part 2 — Monster Messages

## User Overview

Counts candidate messages that match rule `0` under `LOOP_PATCHED_GRAMMAR_POLICY` (`8: 42 | 42 8` and `11: 42 31 | 42 11 31`) and provides an interactive visualization of each message's CYK parse triangle and unfolded witness derivation spans.

## Developer Notes

- **Domain Entry (`domain/solver.ts`)**: Binds `MonsterMessagesSolver` to `LOOP_PATCHED_GRAMMAR_POLICY` and re-exports `solver` via `domain/index.ts`.
- **Visualizer (`viz/MonsterMessagesPart2Visualizer.tsx`)**: Thin wrapper passing `solver` to `MonsterMessagesVisualizer`.
- **Manifest (`index.ts`)**: Exports `manifest` (`PuzzlePartManifest`) with the 31-rule / 15-message Part 2 example (`exampleAnswer: '12'`).
