# Day 25 Shared Domain & Visualization

## User / Consumer Overview
Pure-TypeScript pin-height schematic parser, column-clearance evaluator, bounded trace generator, and interactive SVG visualizer for AoC 2024 Day 25 (*Code Chronicle*).

### Public Exports (`./index.ts`)
- **Schematic Model & Parser (`./schematic.ts`)**: `SchematicKind`, `TumblerSchematic`, `TumblerInventory`, `parseSchematics(raw)`.
- **Pair Fit Evaluator (`./matcher.ts`)**: `PairFitEvaluation`, `evaluatePairFit(inventory, lockIndex, keyIndex)`, `countFittingPairs(inventory)`.
- **Bounded Trace (`./trace.ts`)**: `DEFAULT_MAX_TRACE_STEPS`, `TumblerTracePhase`, `TumblerTraceFrame`, `buildMatchTrace(inventory, options)`.

### UI Components (`./viz/`)
- `TumblerMeshSvg.tsx`: Renders a `W × H` SVG lock/key pin-chamber mesh showing lock pins, key teeth, clearance air gaps, collision cells, and per-column clearance badges.
- `CodeChronicleVisualizer.tsx`: Interactive visualizer combining HUD summary badges, `TumblerMeshSvg`, pair fit table, and `PlaybackControls`.

## Developer / Maintainer Architecture
- **Strict one-way DAG**: `shared/core` -> `schematic.ts` -> `matcher.ts` -> `trace.ts` -> `index.ts` -> `viz/*.tsx` (`index.ts` contains zero `viz/` imports).
- **Zero stored derived state**: `TumblerSchematic`, `TumblerInventory`, `PairFitEvaluation`, and `TumblerTraceFrame` compute widths, clearances, pair indices, phases, and fit rates dynamically via getters.
- **Generalized dimensions**: Supports arbitrary `(W, H)` grids with `H >= 2` (`maxPinHeight = H - 2`) and validates pin contiguity outward from the solid `#` base row.
