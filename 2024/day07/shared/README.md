# `2024/day07/shared` — Bridge Repair Core Domain & Viz Primitives

## Consumer Guide
Pure TypeScript domain primitives for Advent of Code 2024 Day 7 ("Bridge Repair"):

- `operator.ts`: `CalibrationOperator` strategy interface plus `ADD_OPERATOR`, `MUL_OPERATOR`, and `PART1_OPERATORS`.
- `equation.ts`: Immutable `CalibrationEquation` value object with `evaluateSteps(operators)` and `parseCalibrationInput(raw)`.
- `search.ts` & `traceModel.ts`: Fast zero-allocation `solveEquation`, `totalCalibrationResult`, bounded `traceEquation`, and uniformly sampled `traceCalibration`.
- `index.ts`: Pure TypeScript barrel (never imports React/DOM or `./viz/*` so CLI and tests stay Node-pure).
- `viz/`: Pure layout (`treeLayout.ts`) and React SVG components (`ReverseTreeSvg.tsx`, `VerificationRibbon.tsx`, `BridgeRepairVisualizer.tsx`).

## Maintainer Guide
- **Reverse DFS Pruning**: Searches right-to-left from `target` down to `operands[0]` by inverting each candidate `CalibrationOperator`. Multiplication is ordered ahead of addition in `PART1_OPERATORS` because non-divisible branches prune immediately via `remaining % right !== 0n`.
- **Operand `1` Invariant**: Search never prunes on `prev < target` or `prev === remaining`; only `op.tryInvert(remaining, right) === null` prunes, preserving equations with `1` operands (e.g., `10 * 1 = 10` and `1 * 1 * 1 = 1`).
- **Bounded Traces**: `traceEquation` caps recorded `SearchNode` entries at `DEFAULT_MAX_TREE_NODES` (`120`) while still computing exact `visitedCount`, `prunedCount`, and `witness`. `traceCalibration` caps frames at `DEFAULT_MAX_TRACE_STEPS` (`120`) using `sampleTraceIndices` and runs `solveEquation` on unsampled equations.
