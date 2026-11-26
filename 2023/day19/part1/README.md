# AoC 2023 Day 19 Part 1 — Aplenty

## Consumer Guide

- **Domain entrypoint**: `2023/day19/part1/domain` exports `solver` (`PuzzleSolver<AplentyInput, number, WorkflowTraceFrame>`).
- **Web manifest**: `2023/day19/part1/index.ts` exports `manifest` for auto-discovery by `site/registry.ts`.
- **Visualizer**: `AplentyPart1Visualizer` displays telemetry badges, workflow breadcrumb path, active rule/fallback banner, four `[1..4000]+` axis gauge bars (`AxisGaugeBars`), and `PlaybackControls`.

## Maintainer Architecture

- `domain/solver.ts`: Parses workflows and parts via `parseAplentyInput`, evaluates each part via `system.isAccepted(part)` summing `part.total`, and delegates `trace()` to `buildPartRoutingTrace`.
- `viz/AplentyPart1Visualizer.tsx`: Thin wrapper around `2023/day19/shared/viz/WorkflowTraceVisualizer.tsx`, bounded to `DEFAULT_MAX_TRACE_STEPS` (`200`) sampled frames.
- `domain/solver.test.ts`: Verifies the official example (`19114`) via `executeSolver` with a fake `Clock`, strict boundary behavior, all-rejected inputs, and trace sampling.
