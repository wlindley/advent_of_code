# 2020 Day 22 Part 2 — Crab Combat

## User Overview
Simulates Recursive Combat between Player 1 and Player 2: each round checks prior deck configurations within the current game (awarding the game to Player 1 on a repeat), spawns a recursive sub-game when both players hold at least as many cards as their drawn values (or applies the Player 1 max-card shortcut in sub-games), and scores the overall winner's final deck by reverse-positional weights.

## Developer Notes
- **Domain Entry (`domain/solver.ts`)**: Binds `CombatSolver` to `RECURSIVE_COMBAT_POLICY` and re-exports `solver` via `domain/index.ts`.
- **Visualizer (`viz/CrabCombatPart2Visualizer.tsx`)**: Thin wrapper passing `solver` to `CombatArenaVisualizer`.
- **Manifest (`index.ts`)**: Exports `manifest` (`PuzzlePartManifest`) with the official 10-card example (`exampleAnswer: '291'`).
