# AoC 2023 Day 19 Part 2 — Aplenty

## Consumer Guide

- **Domain entrypoint**: `2023/day19/part2/domain` exports `solver` (`PuzzleSolver<WorkflowSystem, bigint, WorkflowTraceFrame>`).
- **Accepted input formats**: Supports both full two-section puzzle inputs (workflows + blank line + parts, ignoring the parts section) and workflow-only inputs.
- **Web manifest**: `2023/day19/part2/index.ts` exports `manifest` for auto-discovery by `site/registry.ts`.
- **Visualizer**: `AplentyPart2Visualizer` displays telemetry badges, workflow breadcrumb path, active rule/fallback banner, four `[1..4000]` axis gauge bars (`AxisGaugeBars`), and `PlaybackControls`.

## Maintainer Architecture

- `domain/solver.ts`: Extracts the workflow block via `extractWorkflowBlock`, parses into `WorkflowSystem` via `parseWorkflowSystem`, counts accepted combinations in `[1..4000]^4` via `system.countAcceptedCombinations(INITIAL_RATING_BOX)`, and delegates `trace()` to `buildBoxSplitTrace`.
- `viz/AplentyPart2Visualizer.tsx`: Thin wrapper around `2023/day19/shared/viz/WorkflowTraceVisualizer.tsx`, bounded to `DEFAULT_MAX_TRACE_STEPS` (`200`) sampled frames.
- `domain/solver.test.ts` & `domain/solver.oracle.test.ts`: Verify the official example (`167409079868000n`) via `executeSolver` with a fake `Clock`, 1-section and 2-section CRLF inputs, invalid input errors, strict boundaries, trace sampling, an independent plain-tuple DFS interval splitter oracle, pairwise box disjointness, `A <-> R` complement conservation, and an exhaustive `[1..5]^4` grid oracle.
