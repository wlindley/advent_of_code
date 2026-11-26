# `2022/day05/shared`

## Consumer Guide
Shared pure-TypeScript domain primitives for Advent of Code 2022 Day 5 ("Supply Stacks").

### Public API (`2022/day05/shared/index.ts`)
- `Crate`, `MoveInstruction`, `SupplyProcedure`, `readTopMessage`: immutable frozen value objects representing `[A-Z]` crates, validated 1-based crane moves, and deep-frozen initial stack configurations with dynamic `stackCount`, `totalCrates`, `moveCount`, and `initialTopMessage` getters.
- `parseSupplyProcedure(raw)`: parses a leading-space-significant crate stack diagram (bottom-to-top with gravity validation) and `move N from A to B` instructions into a `SupplyProcedure`.
- `CraneStrategy`, `CraneTraceFrame`, `DEFAULT_MAX_TRACE_STEPS`, `executeProcedure`, `traceProcedure`: strategy-parameterized crane simulator supporting both full execution and bounded trace sampling (`sampleTraceIndices`) with true `globalPeakHeight` tracking across unsampled intermediate moves.

## Maintainer Guide
- **Pure domain**: `index.ts` exports strictly pure TypeScript modules (`model.ts`, `parser.ts`, `simulator.ts`) with zero React/DOM/Node dependencies. Reusable SVG/playback UI components live separately under `shared/viz/`.
- **Leading whitespace invariant**: Never `.trim()` raw puzzle input or diagram lines before column slicing; leading spaces encode empty left-hand stacks.
- **Part 2 readiness**: `CraneStrategy.arrangeLifted` isolates the LIFO (9000) vs FIFO (9001) difference so Part 2 requires zero changes to `2022/day05/shared/`.
