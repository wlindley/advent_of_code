# Day 23 Shared Domain & Visualization

## User / Consumer Overview
Shared pure-TypeScript undirected LAN graph model, canonical triangle finder, pivoted Bron–Kerbosch maximum-clique solver, bounded snapshot trace builders, and interactive SVG visualizer for AoC 2024 Day 23 (*LAN Party*).

### Public Exports (`./index.ts`)
- **Sorted Utilities (`./sorted.ts`)**: `compareNumbers`, `compareNodeIds`, `lowerBound`, `hasSortedNumber`, `findSortedString`, `intersectSorted`, `differenceSorted`.
- **Graph Model & Parser (`./graph.ts`)**: `LanEdge`, `LanClique`, `LanGraph`, `parseLanGraph(raw)`.
- **Clique Algorithms (`./cliques.ts`)**: `findTriangles(graph, prefix)`, `findMaximumCliqueHistory(graph)`, `findMaximumClique(graph)`.
- **Trace & Snapshot (`./snapshot.ts`)**: `DEFAULT_MAX_TRACE_STEPS`, `LanTracePhase`, `LanPartySnapshot`, `buildTriangleTrace`, `buildMaximumCliqueTrace`.

### UI Components (`./viz/`)
- `LanGraphSvg.tsx`: Renders the full circular node ring (`nodeCount <= 40`) or a focused 2-ring induced subgraph (`activeClique` inner ring + up to 32 neighbor outer halo when `nodeCount > 40`), highlighting active clique edges/nodes and `'t*'` markers.
- `LanPartyVisualizer.tsx`: Shared visualizer accepting `{ rawInput, cacheKey, buildTrace, summaryLabel, formatAnswer }`, rendering HUD badges, `LanGraphSvg`, a 10-row windowed clique table, and `PlaybackControls`.

## Developer / Maintainer Architecture
- **Strict one-way DAG**: `shared/core` -> `sorted.ts` -> `graph.ts` -> `cliques.ts` -> `snapshot.ts` -> `index.ts` -> `viz/*.tsx` (zero `viz/` imports in `index.ts`).
- **Zero stored derived state**: `LanGraph` stores only sorted `_names` and sorted `_adjacency`; all degree metrics, edge lists, clique sizes, and passwords are computed via dynamic getters.
- **Canonical tie-breaking**: `findMaximumCliqueHistory` normalizes `R` (`[...current].sort(compareNumbers)`) before comparing sizes and lexicographic node IDs so pivot-reordered candidates never lose a lexicographic tie.
- **Bounded trace assembly**: `assembleCliqueTrace` uses `validateMaxSteps` and `sampleTraceIndices` to cap frame count (`DEFAULT_MAX_TRACE_STEPS = 48`) so large LAN graphs stay responsive.
