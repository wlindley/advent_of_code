# 2021 Day 2 Shared Submarine Navigation Core (`2021/day02/shared`)

Reusable domain model, polymorphic navigation policies, bounded trajectory geometry projector, and interactive visualizer shared between Part 1 (`DIRECT_NAVIGATION_POLICY`) and Part 2 (`AIM_NAVIGATION_POLICY`).

## Consumer Interface

- `pose.ts`: `SubmarinePose` (immutable frozen `(horizontal, depth, aim)` state with `ORIGIN`, dynamic `product`, and `withDelta`).
- `course.ts`: `CommandDirection`, `SubmarineCommand`, `isCommandDirection`, `SubmarineCourse`, and `parseSubmarineCourse`.
- `navigationPolicy.ts`: `NavigationPolicy`, `TableNavigationPolicy`, `DIRECT_NAVIGATION_POLICY`, and `AIM_NAVIGATION_POLICY`.
- `navigation.ts`: `DEFAULT_MAX_TRACE_STEPS` (`120`), `NavigationTraceFrame`, `navigateCourse`, and `traceCourse`.
- `trajectoryGeometry.ts`: `TRAJECTORY_VIEWBOX`, `MAX_TRAJECTORY_POINTS` (`240`), `scaleBigIntCoord`, `projectPose`, `buildTrajectoryGeometry`, and `buildActiveSegmentOverlay`.
- `index.ts`: pure TypeScript barrel exporting domain APIs without any UI/React imports.
- `viz/DiveTrajectoryVisualizer.tsx`: parameterizable light-mode 2D trajectory SVG and `<PlaybackControls>` component.

## Maintainer Architecture

- **Policy Strategy**: `TableNavigationPolicy` replaces command-direction `switch` chains with frozen dispatch tables (`DIRECT_NAVIGATION_POLICY` vs `AIM_NAVIGATION_POLICY`), isolating Part 1 and Part 2 rules behind a single `NavigationPolicy` interface.
- **Exact BigInt Coordinates**: All pose coordinates and products use `bigint`, while `scaleBigIntCoord` and `computeAimSlope` perform fixed-point BigInt scaling before converting to SVG pixels.
- **Bounded Visualization**: Trace sampling (`DEFAULT_MAX_TRACE_STEPS = 120`) and trajectory polyline sampling (`MAX_TRAJECTORY_POINTS = 240`) bound playback and DOM size via `sampleTraceIndices`.
