# 2021 Day 1 Shared Sonar Sweep Core (`2021/day01/shared`)

Reusable domain model, generalized stride-`W` sliding-window increase solver, SVG bathymetry geometry projector, and interactive visualizer shared between Part 1 (`W = 1`) and Part 2 (`W = 3`).

## Consumer Interface

- `sonarReport.ts`: `validateWindowSize`, `SonarReport` (immutable frozen sequence of validated safe-integer depth readings with `count`, `minDepth`, `maxDepth`, `depthAt`, and exact `BigInt` `windowSum`), and `parseSonarReport`.
- `windowSweep.ts`: `DEFAULT_MAX_TRACE_STEPS` (`120`), `classifyDelta`, `countWindowIncreases`, and `traceWindowIncreases` (`SweepTraceFrame`, `SweepDeltaKind`).
- `profileGeometry.ts`: `PROFILE_VIEWBOX`, `MAX_PROFILE_POINTS` (`240`), `projectDepthPoint`, `buildProfileGeometry`, and `buildComparisonOverlay`.
- `index.ts`: pure TypeScript barrel exporting domain APIs without any UI/React imports.
- `viz/SonarSweepVisualizer.tsx`: parameterizable light-mode bathymetry chart and `<PlaybackControls>` component.

## Maintainer Architecture

- **Algebraic Cancellation**: Comparing consecutive `W`-element sums cancels all `W - 1` overlapping readings, reducing `sum(i - W + 1 .. i) > sum(i - W .. i - 1)` to `depth[i] > depth[i - W]` in `O(N)` time and `O(1)` extra space.
- **Bounded Visualization**: Both the trace sampler (`DEFAULT_MAX_TRACE_STEPS = 120`) and profile geometry (`MAX_PROFILE_POINTS = 240`) bound SVG and playback sizes uniformly via `sampleTraceIndices`.
