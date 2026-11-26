# Day 10 Part 1 — Factory

Computes the minimum total button presses required to configure every factory machine's indicator lights from an all-off initial state.

## Consumer Guide

- **Domain API** (`2025/day10/part1/domain`):
  - `solver`: `PuzzleSolver<readonly FactoryMachine[], number, MachineTraceFrame>` (`parse`, `solve`, `trace`).
  - `buildLightSystem(machine)`: Constructs the `Gf2LinearSystem` over `machine.buttonCount` binary variables.
  - `solveMachine(machine, index?)`: Solves for the minimum-weight press mask (`bigint`) or throws if unreachable.
  - `solveFactoryLights(machines)`: Sums minimum presses across all machines.
  - `traceFactoryLights(machines, options?)`: Emits bounded playback frames (`DEFAULT_MAX_TRACE_STEPS = 120`).
- **Visualizer** (`FactoryLightsVisualizer`): Renders the indicator light bank, button control strip (`P` pivot vs `F` free), GF(2) RREF augmented matrix grid, HUD metrics, and `PlaybackControls`.

## Maintainer Notes

- **GF(2) Reduction**: Button presses commute mod 2, so pressing a button more than once is redundant. Each machine maps to `A x = b (mod 2)` solved via full Gauss-Jordan RREF (`shared/core/gf2.ts`) and Gray-code enumeration over `nullspaceBasis`.
- **Bounded Visualization**: `traceFactoryLights` downsamples uniformly to `<= 120` frames so large puzzle inputs remain responsive in the browser.
- **Pure Domain**: Zero React/DOM imports in `domain/` or `shared/`.
