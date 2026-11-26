# Day 24 Shared Domain & Visualization

## User / Consumer Overview
Shared pure-TypeScript combinational logic circuit model, topological evaluator, typed-array adder compiler & functional verifier, structural ripple-carry adder repair solver, bounded snapshot trace builders, and interactive SVG visualizer for AoC 2024 Day 24 (*Crossed Wires*).

### Public Exports (`./index.ts`)
- **Primitives (`./types.ts`)**: `WireBit`, `GateOp`, `BusPrefix`, `WireSwap`, `formatBitWire`, `parseBitWire`, `assertValidWireName`.
- **Circuit Model & Parser (`./circuit.ts`)**: `LogicGate`, `LogicCircuit`, `parseCircuit(raw)`.
- **Topological Evaluator (`./evaluator.ts`)**: `CircuitEvaluation`, `buildWireGraph`, `assembleBusValue`, `evaluateCircuit`.
- **Functional Adder Verifier (`./adderVerify.ts`)**: `CompiledAdderCircuit`, `tryCompileAdder`, `evaluateCompiledAdder`, `verifyAdderFunctionally`.
- **Ripple-Carry Adder Repair (`./adderRepair.ts`)**: `AdderRepairResult`, `repairAdder(circuit, swapCount)`.
- **Trace & Snapshot (`./snapshot.ts`)**: `DEFAULT_MAX_TRACE_STEPS`, `CircuitTracePhase`, `CircuitTraceMode`, `CircuitSnapshot`, `buildEvaluationTrace`, `buildRepairTrace`.

### UI Components (`./viz/`)
- `circuitLayout.tsx`: Computes layered DAG node positions (or focused bit-slice / gate window for large 220+ gate circuits).
- `CircuitSvg.tsx`: Renders gate nodes, color-coded signal edges (`0`, `1`, unsettled, active/swapped), and bit-bus summary.
- `CircuitVisualizer.tsx`: Shared visualizer accepting `{ rawInput, cacheKey, buildTrace, summaryLabel, formatAnswer }`, rendering HUD badges, `CircuitSvg`, gate/swap table, and `PlaybackControls`.

## Developer / Maintainer Architecture
- **Strict one-way DAG**: `shared/core` -> `types.ts` -> `circuit.ts` -> `evaluator.ts` -> `adderVerify.ts` -> `adderRepair.ts` -> `snapshot.ts` -> `index.ts` -> `viz/*.tsx` (zero `viz/` imports in `index.ts`).
- **Cycle-tolerant parsing**: `parseCircuit` permits cycles so corrupted Part 2 inputs parse cleanly; `evaluateCircuit` and `tryCompileAdder` detect cycles via `DirectedGraph.topologicalOrder()`.
- **Zero stored derived state**: `LogicCircuit`, `CircuitEvaluation`, and `CircuitSnapshot` compute `wireNames`, `wireValues`, `zValue`, and `answer` dynamically via getters.
- **Unfrozen typed arrays**: `CompiledAdderCircuit` keeps `Int32Array` and `Uint8Array` views unfrozen and freezes only the outer wrapper object.
