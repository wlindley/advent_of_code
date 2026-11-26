# `2019/day06/shared` — Universal Orbit Map Shared Domain & Viz

## Consumer Guide
Pure TypeScript rooted-tree orbit model, parser, layout/histogram helpers, query policies, and shared React SVG visualizers for AoC 2019 Day 6.

- `parseOrbitMap(raw)`: parses `PARENT)CHILD` lines into a validated, BFS-ordered `OrbitMap`.
- `OrbitMap`: immutable wrapper over CSR `Int32Array` tables exposing `totalOrbits`, `maxDepth`, `findTransferRoute(from, to)`, and node accessors.
- `TOTAL_ORBITS_POLICY`, `SANTA_TRANSFER_POLICY`, `createTransferPolicy`: query/trace policies bound via `new OrbitMapSolver(policy)`.
- `viz/OrbitMapVisualizer.tsx`: shared interactive visualizer (imported directly by part visualizers; excluded from `shared/index.ts` to keep domain pure).

## Maintainer Guide
Strict one-way DAG:
`types.ts` -> `orbitMap.ts` -> (`parser.ts`, `layout.ts`) -> `policy.ts` -> `solver.ts` -> `index.ts` -> `viz/*.tsx`.
- `OrbitMap` validates in-degree 0 on `COM`, in-degree 1 elsewhere, and full reachability (`labels.length === parentByChild.size + 1`) via a single BFS pass.
- Tree SVG rendering is gated at `MAX_TREE_SVG_NODES = 64`; depth histogram is bounded at `MAX_HISTOGRAM_BINS = 48`.
