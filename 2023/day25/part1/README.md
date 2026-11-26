# AoC 2023 Day 25 Part 1 — Snowverload

## Consumer Guide

- **Domain solver** (`domain/solver.ts`, re-exported from `domain/index.ts`):
  - `solver`: `Required<PuzzleSolver<WiringGraph, number, MinCutTraceFrame>>` compatible with `tools/aoc/cli.ts`.
  - `parse(raw)` builds a canonical `WiringGraph`; `solve(graph)` returns `sizeS * sizeT` across the unique 3-edge cut; `trace(graph, options)` emits bounded frames (`DEFAULT_MAX_TRACE_STEPS = 48`).
- **Site manifest** (`index.ts`):
  - Registers `manifest` with the 15-node example (`exampleAnswer: '54'`), `solver`, and `SnowverloadPart1Visualizer`.
- **Visualizer** (`viz/SnowverloadPart1Visualizer.tsx`):
  - Thin wrapper forwarding `rawInput` to `../../shared/viz/SnowverloadVisualizer` for bipartite chasm rendering and `PlaybackControls`.

## Maintainer Architecture

- `part1/domain/solver.ts` is pure TypeScript delegating parsing, capped Edmonds-Karp min-cut discovery, and trace construction to `../../shared`.
- `part1/viz/SnowverloadPart1Visualizer.tsx` contains presentation wiring only; zero domain rules live in React components or `part1/index.ts`.
