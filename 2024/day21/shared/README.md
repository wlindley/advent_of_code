# Day 21 Shared Domain & Visualization

## User / Consumer Overview
Shared pure-TypeScript DP engine, forward simulator, and interactive visualizer for AoC 2024 Day 21 (*Keypad Conundrum*). Parameterized by `KeypadConfig(directionalRobots)` so Part 1 (`D = 2`) and Part 2 (`D = 25`) share the exact same model, DP table, trace builder, and UI.

### Public Exports (`./index.ts`)
- **Model (`./model.ts`)**: `GridCoord`, `DoorCode`, `KeypadConfig`, `CodeComplexity`, `ChainSolveResult`, `PART1_DIRECTIONAL_ROBOTS`, `PART2_DIRECTIONAL_ROBOTS`, `NUMERIC_KEYS`, `DIRECTIONAL_KEYS`, `DIRECTION_DELTAS`.
- **Parser (`./parser.ts`)**: `parseDoorCodes(raw)`.
- **Keypads (`./keypad.ts`)**: `Keypad<K>`, `NUMERIC_KEYPAD`, `DIRECTIONAL_KEYPAD`.
- **DP (`./dp.ts`)**: `TransitionChoice`, `DirectionalCostTable`, `buildDirectionalCostTable`, `numericTransition`, `solveDoorCode`, `solveDoorCodes`, `buildNumericSequence`, `reconstructLayerSequences`.
- **Simulator (`./simulator.ts`)**: `simulateKeypad`, `simulateRobotChain`.
- **Trace & Solver (`./snapshot.ts`)**: `KeypadConundrumSnapshot`, `DEFAULT_MAX_TRACE_STEPS`, `DEFAULT_MAX_RECONSTRUCT_LENGTH`, `buildKeypadTrace`, `createKeypadConundrumSolver`.

### UI Components (`./viz/`)
- `KeypadSvg.tsx`: 4×3 numeric keypad SVG (highlighting active code keys and hazard gap `(3, 0)`) and 5×5 directional cost heatmap SVG at `snapshot.activeDepth`.
- `KeypadConundrumVisualizer.tsx`: Complete HUD, keypad + heatmap SVGs, complexity table, layer chain readout, and `PlaybackControls`.

## Developer / Maintainer Architecture
- **Strict one-way DAG**: `shared/core` -> `model.ts` -> `parser.ts` / `keypad.ts` -> `dp.ts` / `simulator.ts` -> `snapshot.ts` -> `index.ts` -> `viz/*` (zero `viz/` imports in `index.ts`).
- **Corner-gap invariant**: `Keypad` enforces a grid corner gap so every shortest orthogonal move sequence needs at most two single-turn candidates (`horiz+vert` and `vert+horiz`), pruning whichever crosses the gap.
- **Exact `bigint` DP & descending expansion**: `DirectionalCostTable` computes exact `bigint` costs bottom-up across `0..D`. `reconstructLayerSequences` guards against huge strings via `maxOutputLength` and expands `Layer 0` through depths `D, D-1, ..., 1` in descending order so every intermediate expansion matches the DP cost invariant.
- **Forward simulator verification**: `simulateRobotChain` executes `D` directional pads and the numeric pad without calling `keyAt` on `'A'`, serving as an independent oracle for `reconstructLayerSequences`.
