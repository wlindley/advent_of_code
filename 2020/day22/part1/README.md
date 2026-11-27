# 2020 Day 22 Part 1 — Crab Combat

## User Overview
Simulates a standard game of Crab Combat between Player 1 and Player 2: each round both players draw their top card, the higher card wins both cards (placed at the bottom of the winner's deck, winner's card first), and the winner's final deck is scored by reverse-positional weights.

## Developer Notes
- **Domain Entry (`domain/solver.ts`)**: Binds `CombatSolver` to `STANDARD_COMBAT_POLICY` and re-exports `solver` via `domain/index.ts`.
- **Visualizer (`viz/CrabCombatPart1Visualizer.tsx`)**: Thin wrapper passing `solver` to `CombatArenaVisualizer`.
- **Manifest (`index.ts`)**: Exports `manifest` (`PuzzlePartManifest`) with the official 10-card example (`exampleAnswer: '306'`).
