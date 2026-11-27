# 2021 Day 22 Part 1 — Reactor Reboot

## User Documentation
- `solver`: Parses `on`/`off` cuboid reboot steps, clips to `[-50..50]^3`, and returns the exact `bigint` count of lit cubes.
- `manifest`: Registers Part 1 metadata, the official 22-step example (`590784`), and `Part1Visualizer` (interactive 3D isometric playback).

## Developer Notes
- Thin entrypoint delegating entirely to `../../shared` (`createReactorSolver(INITIALIZATION_POLICY)` and `ReactorVisualizer`).
- `domain/solver.test.ts` imports `{ solver } from './index'` to avoid pulling TSX into Vitest coverage.
