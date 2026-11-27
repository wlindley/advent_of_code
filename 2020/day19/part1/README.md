# 2020 Day 19 Part 1 — Monster Messages

## User Overview

Counts candidate messages that match rule `0` under `RAW_GRAMMAR_POLICY` and provides an interactive visualization of each message's CYK parse triangle and unfolded witness derivation spans.

## Developer Notes

- **Domain Entry (`domain/solver.ts`)**: Binds `MonsterMessagesSolver` to `RAW_GRAMMAR_POLICY` and re-exports `solver` via `domain/index.ts`.
- **Visualizer (`viz/MonsterMessagesPart1Visualizer.tsx`)**: Thin wrapper passing `solver` to `MonsterMessagesVisualizer`.
- **Manifest (`index.ts`)**: Exports `manifest` (`PuzzlePartManifest`) with the 6-rule / 5-message example (`exampleAnswer: '2'`).
