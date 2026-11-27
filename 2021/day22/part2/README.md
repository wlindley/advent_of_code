# 2021 Day 22 Part 2 — Reactor Reboot

## User Documentation
- `solver`: Parses `on`/`off` cuboid reboot steps across the full unclipped 3D grid and returns the exact `bigint` count of lit cubes.
- `manifest`: Registers Part 2 metadata, the official 60-step example (`2758514936282235`), and `Part2Visualizer` (interactive 3D isometric playback).

## Developer Notes
- Thin entrypoint delegating entirely to `../../shared` (`createReactorSolver(FULL_REACTOR_POLICY)` and `ReactorVisualizer`).
- `domain/solver.test.ts` imports `{ solver } from './index'` to avoid pulling TSX into Vitest coverage.
