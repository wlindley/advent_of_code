# AoC 2023 Day 20 Shared Domain (`Pulse Propagation`)

## Consumer Guide

- **Types & Validators (`types.ts`)**: Protocol constants (`BROADCASTER_NAME`, `BUTTON_NAME`, `DEFAULT_MAX_PULSES_PER_PRESS`), `ModuleKind`, `Pulse`, `ModuleDescriptor`, `PulseEvent`, `PressSummary`, `NodeStateSnapshot`, `validateModuleName`, and `validatePositiveInt`.
- **Polymorphic Nodes (`nodes.ts`)**: `CircuitNode` interface implemented by `BroadcasterNode`, `FlipFlopNode`, `ConjunctionNode`, and `SinkNode`, instantiated via `NODE_FACTORIES` and `createCircuitNode`.
- **Blueprint & Parser (`blueprint.ts`, `parser.ts`)**: `ModuleSpec`, `CircuitBlueprint` (synthesizing implicit sinks and deduplicated input lists), and `parseCircuitBlueprint`.
- **Simulator (`simulator.ts`)**: `CircuitSimulator` executes FIFO pulse propagation per button press with `pressButton`, `runPresses`, `snapshotModules`, and dynamic `product: bigint`.
- **Layout & Trace (`layout.ts`, `trace.ts`)**: `computeCircuitLayout` (BFS layered graph) and two-pass `buildPulseTrace` bounded to `DEFAULT_MAX_TRACE_STEPS` (`200`) frames.

## Maintainer Architecture

- **Pure Domain Barrel**: `shared/index.ts` exports pure TypeScript domain modules only and never imports `viz/`.
- **Acyclic Module DAG**: `types <- nodes <- blueprint <- parser / simulator / layout <- trace`.
- **Extensibility**: `CircuitSimulator` emits post-application `PulseEvent` callbacks so Part 1 (pulse product) and Part 2 (cycle detection on feeder conjunctions) share the exact simulation engine without modifying `shared/`.
