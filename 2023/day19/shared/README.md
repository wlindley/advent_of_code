# AoC 2023 Day 19 Shared Domain (`Aplenty`)

## Consumer Guide

- **Types & Validation (`types.ts`)**: `CATEGORIES` (`x, m, a, s`), `ENTRY_WORKFLOW` (`'in'`), `isTerminalOutcome`, `validateWorkflowName`, `validateWorkflowTarget`, `validatePositiveInt`.
- **Entities (`partRating.ts`, `workflow.ts`, `ratingBox.ts`)**:
  - `PartRating`: Immutable 4-category rating with dynamic `total` and `valueOf(cat)`.
  - `ConditionalRule` & `Workflow`: Ordered strict `<` / `>` threshold rules and unconditional fallback.
  - `RatingBox`: 4D hyperrectangle backed by `ClosedInterval`, supporting exact `volume: bigint`, `split(rule)`, `uniform(min, max)`, and `fromPart(part)`.
- **System & Parser (`workflowSystem.ts`, `parser.ts`)**:
  - `WorkflowSystem`: DAG-validated workflow graph (rejecting missing `'in'`, duplicate names, dangling targets, and cycles via `DirectedGraph`), providing `routePart`, `isAccepted`, `collectAcceptedBoxes`, and `countAcceptedCombinations`.
  - `parseWorkflowSystem` & `parseAplentyInput`: Strict regex parsers returning frozen domain structures.
- **Trace (`trace.ts`)**: `buildPartRoutingTrace` (Part 1) and `buildBoxSplitTrace` (Part 2) bounded to `DEFAULT_MAX_TRACE_STEPS = 200` frames via `sampleTraceIndices`.

## Maintainer Architecture

- **Pure Domain Barrel**: `shared/index.ts` exports pure TypeScript domain modules only and never imports `viz/`.
- **Exact Partitioning**: `applyWorkflowToBox` propagates disjoint remaining sub-boxes through rules and short-circuits immediately when `remaining === null`, ensuring no double-counting and exact `bigint` volumes for `[1..4000]^4`.
- **Differential Verification**: `workflowSystem.oracle.test.ts` cross-checks `routePart`, `collectAcceptedBoxes`, and `countAcceptedCombinations` against an independent recursive string-rule oracle and an exhaustive `[1..6]^4` grid count.
